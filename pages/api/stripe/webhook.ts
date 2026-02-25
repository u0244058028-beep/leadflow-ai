import { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable: any) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sigHeader = req.headers['stripe-signature'];
  const sig = Array.isArray(sigHeader) ? sigHeader[0] : sigHeader;

  if (!sig) {
    return res.status(400).json({ error: 'Missing Stripe signature' });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const subscriptionId = session.subscription;
        const customerId = session.customer;

        if (!userId) {
          throw new Error('No userId in metadata');
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);

        await supabaseAdmin
          .from('profiles')
          .update({
            subscription_id: subscriptionId,
            subscription_status: 'active',
            subscription_period_end: new Date(subscription.current_period_end * 1000),
            trial_ends_at: null,
            stripe_customer_id: customerId,
          })
          .eq('id', userId);

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;

        if (userId) {
          await supabaseAdmin
            .from('profiles')
            .update({
              subscription_status: subscription.status,
              subscription_period_end: new Date(subscription.current_period_end * 1000),
              cancelled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
            })
            .eq('id', userId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;

        if (userId) {
          await supabaseAdmin
            .from('profiles')
            .update({
              subscription_status: 'cancelled',
              subscription_id: null,
            })
            .eq('id', userId);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        const customer = await stripe.customers.retrieve(customerId as string);
        const userId = (customer as any).metadata?.userId;

        if (userId) {
          await supabaseAdmin
            .from('profiles')
            .update({
              subscription_status: 'past_due',
            })
            .eq('id', userId);
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.json({ received: true }); // Always return 200 to Stripe
  }
}
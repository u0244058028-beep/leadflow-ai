import { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabaseClient';

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
  
  // 🔧 FIX: Håndter at signature kan være string eller string[]
  const sig = Array.isArray(sigHeader) ? sigHeader[0] : sigHeader;

  if (!sig) {
    console.error('❌ Ingen Stripe-signatur funnet i headers');
    return res.status(400).json({ error: 'Mangler Stripe-signatur' });
  }

  console.log('🔍 Webhook mottatt');
  console.log('Signature:', sig.substring(0, 20) + '...');
  console.log('Body length:', buf.length);

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    console.log('✅ Event konstruert:', event.type);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err);
    return res.status(400).json({ 
      error: 'Webhook signature verification failed',
      message: err instanceof Error ? err.message : 'Unknown error'
    });
  }

  try {
    console.log('🔄 Behandler event:', event.type);
    
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const subscriptionId = session.subscription;
        const customerId = session.customer;

        console.log('💰 checkout.session.completed:', { userId, subscriptionId, customerId });

        if (!userId) {
          console.log('❌ Ingen userId i metadata');
          return res.status(400).json({ error: 'Ingen userId i metadata' });
        }

        // Hent abonnementsdetaljer fra Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
        console.log('📊 Abonnementsdetaljer:', {
          status: subscription.status,
          current_period_end: subscription.current_period_end
        });

        // Oppdater brukeren i databasen
        const { data: updateData, error: updateError } = await supabase
          .from('profiles')
          .update({
            subscription_id: subscriptionId,
            subscription_status: 'active',
            subscription_period_end: new Date(subscription.current_period_end * 1000),
            trial_ends_at: null,
            stripe_customer_id: customerId,
          })
          .eq('id', userId)
          .select();

        if (updateError) {
          console.error('❌ Supabase update error:', updateError);
          return res.status(500).json({ 
            error: 'Supabase update feilet',
            details: updateError.message 
          });
        }

        console.log('✅ Bruker oppdatert i Supabase:', updateData);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;

        if (userId) {
          await supabase
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
          await supabase
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
          await supabase
            .from('profiles')
            .update({
              subscription_status: 'past_due',
            })
            .eq('id', userId);
        }
        break;
      }

      default:
        console.log('📌 Ignorerer event:', event.type);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook handling error:', error);
    res.status(500).json({ 
      error: 'Webhook handling failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
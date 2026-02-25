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
    console.error('❌ Missing Stripe signature');
    return res.status(400).json({ error: 'Missing Stripe signature' });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    console.log('✅ Webhook event received:', event.type);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const subscriptionId = session.subscription;
        const customerId = session.customer; // Dette er stripe_customer_id
        const customerEmail = session.customer_details?.email;

        console.log('💰 checkout.session.completed:', {
          userId,
          subscriptionId,
          customerId,
          customerEmail
        });

        if (!userId) {
          console.error('❌ No userId in metadata');
          return res.status(400).json({ error: 'No userId in metadata' });
        }

        // Hent abonnementsdetaljer fra Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
        console.log('📊 Subscription details:', {
          status: subscription.status,
          current_period_end: subscription.current_period_end
        });

        // Oppdater brukeren i databasen - inkluderer ALLE felt
        const { data: updateData, error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({
            subscription_id: subscriptionId,
            subscription_status: 'active',
            subscription_period_end: new Date(subscription.current_period_end * 1000),
            trial_ends_at: null,
            stripe_customer_id: customerId, // 🟢 VIKTIG: Denne må være med!
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)
          .select();

        if (updateError) {
          console.error('❌ Supabase update error:', updateError);
          return res.status(500).json({ error: 'Database update failed' });
        }

        console.log('✅ User activated successfully:', updateData);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;

        console.log('🔄 subscription.updated:', {
          userId,
          status: subscription.status,
          cancel_at_period_end: subscription.cancel_at_period_end
        });

        if (userId) {
          const updateData: any = {
            subscription_status: subscription.status,
            subscription_period_end: new Date(subscription.current_period_end * 1000),
            updated_at: new Date().toISOString(),
          };

          // Hvis den er satt til å kansellere ved periodeslutt
          if (subscription.cancel_at_period_end) {
            updateData.cancelled_at = new Date().toISOString();
          }

          // Hvis den blir aktivert igjen
          if (subscription.status === 'active' && subscription.cancel_at_period_end === false) {
            updateData.cancelled_at = null;
          }

          const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update(updateData)
            .eq('id', userId);

          if (updateError) {
            console.error('❌ Error updating subscription:', updateError);
          } else {
            console.log('✅ Subscription updated');
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;

        console.log('🗑️ subscription.deleted:', { userId });

        if (userId) {
          const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({
              subscription_status: 'cancelled',
              subscription_id: null,
              subscription_period_end: null,
              cancelled_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

          if (updateError) {
            console.error('❌ Error deleting subscription:', updateError);
          } else {
            console.log('✅ Subscription deleted');
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        console.log('❌ invoice.payment_failed:', { customerId });

        // Hent customer for å finne userId
        const customer = await stripe.customers.retrieve(customerId as string);
        const userId = (customer as any).metadata?.userId;

        if (userId) {
          const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({
              subscription_status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

          if (updateError) {
            console.error('❌ Error updating payment failure:', updateError);
          } else {
            console.log('✅ Payment failure recorded');
          }
        }
        break;
      }

      default:
        console.log('📌 Unhandled event type:', event.type);
    }

    // Alltid returner 200 OK til Stripe
    res.json({ received: true });
    
  } catch (error) {
    console.error('❌ Webhook handling error:', error);
    // Selv ved feil, returner 200 for å unngå at Stripe prøver igjen
    res.json({ received: true });
  }
}
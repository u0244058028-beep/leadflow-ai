import { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId, email } = req.body;
    console.log('🔍 Create-checkout start:', { userId, email });

    if (!userId || !email) {
      console.log('❌ Mangler userId eller email');
      return res.status(400).json({ message: 'Mangler userId eller email' });
    }

    // Sjekk at price ID finnes
    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY;
    console.log('💰 Price ID:', priceId);
    
    if (!priceId) {
      console.log('❌ Price ID mangler i miljøvariabler');
      return res.status(500).json({ message: 'Price ID ikke konfigurert' });
    }

    // Hent eller opprett Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    console.log('👤 Profil funnet:', profile);

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      console.log('➕ Oppretter ny Stripe customer for:', email);
      const customer = await stripe.customers.create({
        email,
        metadata: { userId },
      });
      
      customerId = customer.id;
      console.log('✅ Customer opprettet:', customerId);

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    // Opprett checkout session
    console.log('🛒 Oppretter checkout session med priceId:', priceId);
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: 14,
        trial_settings: {
          end_behavior: {
            missing_payment_method: 'cancel',
          },
        },
        metadata: { userId },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      metadata: { userId },
      allow_promotion_codes: true,
    });

    console.log('✅ Checkout session opprettet:', session.id);
    res.status(200).json({ url: session.url });
    
  } catch (error) {
    console.error('❌ Stripe error:', error);
    // Send mer detaljert feilmelding
    res.status(500).json({ 
      message: 'Intern serverfeil', 
      error: error instanceof Error ? error.message : 'Ukjent feil' 
    });
  }
}
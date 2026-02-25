import { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Tillat CORS for debugging
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, email } = req.body;
    
    // SJEKK 1: Input
    if (!userId || !email) {
      return res.status(400).json({ 
        error: 'Mangler påkrevde felt',
        received: { userId, email }
      });
    }

    // SJEKK 2: Miljøvariabler
    const envCheck = {
      hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
      hasPublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      hasPriceId: !!process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY,
      hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
      priceIdValue: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY || 'ikke satt',
      appUrlValue: process.env.NEXT_PUBLIC_APP_URL || 'ikke satt',
    };

    // Hvis noe mangler, returner detaljert feil
    if (!envCheck.hasSecretKey || !envCheck.hasPriceId) {
      return res.status(500).json({
        error: 'Miljøvariabler mangler',
        env: envCheck
      });
    }

    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY!;

    // SJEKK 3: Supabase
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      return res.status(500).json({ 
        error: 'Supabase-feil',
        details: profileError.message
      });
    }

    let customerId = profile?.stripe_customer_id;

    // SJEKK 4: Stripe customer
    if (!customerId) {
      try {
        const customer = await stripe.customers.create({
          email,
          metadata: { userId },
        });
        customerId = customer.id;

        await supabase
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', userId);
      } catch (stripeError: any) {
        return res.status(500).json({ 
          error: 'Stripe customer creation feilet',
          message: stripeError.message,
          type: stripeError.type
        });
      }
    }

    // SJEKK 5: Opprett checkout session
    try {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        subscription_data: {
          trial_period_days: 14,
          metadata: { userId },
        },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
        metadata: { userId },
      });

      return res.status(200).json({ url: session.url });
      
    } catch (stripeError: any) {
      return res.status(500).json({ 
        error: 'Checkout session creation feilet',
        message: stripeError.message,
        type: stripeError.type,
        code: stripeError.code,
        param: stripeError.param
      });
    }

  } catch (error: any) {
    return res.status(500).json({ 
      error: 'Uventet feil',
      message: error.message,
      stack: error.stack
    });
  }
}
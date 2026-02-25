import { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Tillat CORS for debugging
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;
    console.log('🔍 Portal API start - userId:', userId);

    if (!userId) {
      console.log('❌ Missing userId');
      return res.status(400).json({ message: 'Missing userId' });
    }

    // Hent profilen
    console.log('📊 Henter profil for userId:', userId);
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();  // Bruk maybeSingle i stedet for single

    if (error) {
      console.error('❌ Supabase error:', error);
      return res.status(500).json({ 
        message: 'Database error', 
        error: error.message,
        details: error
      });
    }

    console.log('📦 Profile data:', profile);

    if (!profile) {
      console.log('❌ Ingen profil funnet for userId:', userId);
      return res.status(404).json({ message: 'Profile not found' });
    }

    if (!profile.stripe_customer_id) {
      console.log('❌ Ingen stripe_customer_id i profilen');
      return res.status(400).json({ 
        message: 'No Stripe customer found',
        profile: profile 
      });
    }

    console.log('✅ Stripe customer ID funnet:', profile.stripe_customer_id);

    // Opprett portal session
    console.log('🔄 Oppretter portal session for customer:', profile.stripe_customer_id);
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/profile`,
    });

    console.log('✅ Portal session opprettet:', session.url);
    res.status(200).json({ url: session.url });
    
  } catch (error: any) {
    console.error('❌ Fatal error:', error);
    res.status(500).json({ 
      message: error.message || 'Internal server error',
      error: error.toString(),
      stack: error.stack
    });
  }
}
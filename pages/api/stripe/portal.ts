import { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;
    console.log('🔍 Portal API called for userId:', userId);

    if (!userId) {
      return res.status(400).json({ message: 'Missing userId' });
    }

    // Hent profilen
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    console.log('📊 Profile from DB:', profile);

    if (error) {
      console.error('❌ Database error:', error);
      return res.status(500).json({ message: 'Database error', error: error.message });
    }

    if (!profile?.stripe_customer_id) {
      console.log('❌ No Stripe customer ID found for user:', userId);
      return res.status(400).json({ 
        message: 'No Stripe customer found. This usually happens if your account was created before Stripe integration. Please contact support.' 
      });
    }

    console.log('✅ Found stripe_customer_id:', profile.stripe_customer_id);

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/profile`,
    });

    console.log('✅ Portal session created:', session.url);
    res.status(200).json({ url: session.url });
    
  } catch (error: any) {
    console.error('❌ Portal error:', error);
    res.status(500).json({ 
      message: error.message || 'Internal server error',
      error: error.toString()
    });
  }
}
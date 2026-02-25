import { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Tillat CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;
    console.log('🔍 Portal API - userId mottatt:', userId);

    if (!userId) {
      return res.status(400).json({ message: 'Missing userId' });
    }

    // Først, sjekk om brukeren finnes i auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('👤 Auth user:', user?.id);

    // Hent profilen med maybeSingle() for å unngå 404-feil
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, email, stripe_customer_id, subscription_status')
      .eq('id', userId)
      .maybeSingle();

    console.log('📊 Profile query result:', { profile, error });

    if (error) {
      console.error('❌ Database error:', error);
      return res.status(500).json({ 
        message: 'Database error', 
        error: error.message 
      });
    }

    if (!profile) {
      console.log('❌ Ingen profil funnet for userId:', userId);
      
      // Prøv å finne brukeren via email som backup
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.email) {
        const { data: profileByEmail } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', userData.user.email)
          .maybeSingle();
        
        console.log('📧 Søkte på email:', userData.user.email, profileByEmail);
        
        if (profileByEmail) {
          return res.status(200).json({ 
            message: 'Found profile by email',
            profile: profileByEmail 
          });
        }
      }
      
      return res.status(404).json({ 
        message: 'Profile not found',
        userId: userId 
      });
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
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/profile`,
    });

    console.log('✅ Portal session opprettet');
    res.status(200).json({ url: session.url });
    
  } catch (error: any) {
    console.error('❌ Fatal error:', error);
    res.status(500).json({ 
      message: error.message || 'Internal server error',
      error: error.toString()
    });
  }
}
import { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'Missing userId' });
    }

    // Get user's subscription ID from database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_id, stripe_customer_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!profile.subscription_id) {
      return res.status(400).json({ message: 'No active subscription found' });
    }

    // Cancel subscription at period end (not immediately)
    const subscription = await stripe.subscriptions.update(
      profile.subscription_id,
      {
        cancel_at_period_end: true,
      }
    );

    // Update database
    await supabase
      .from('profiles')
      .update({
        subscription_status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', userId);

    res.status(200).json({ 
      message: 'Subscription will be cancelled at period end',
      subscription 
    });
  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
}
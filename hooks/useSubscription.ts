import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface SubscriptionStatus {
  isActive: boolean;
  isTrial: boolean;
  trialEndsAt: Date | null;
  daysLeft: number | null;
  subscriptionStatus: string | null;
  loading: boolean;
}

export function useSubscription() {
  const [status, setStatus] = useState<SubscriptionStatus>({
    isActive: false,
    isTrial: false,
    trialEndsAt: null,
    daysLeft: null,
    subscriptionStatus: null,
    loading: true,
  });

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setStatus(prev => ({ ...prev, loading: false }));
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_status, trial_ends_at')
          .eq('id', user.id)
          .single();

        if (profile) {
          const trialEndsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null;
          const now = new Date();
          const daysLeft = trialEndsAt 
            ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
            : null;

          const isTrial = profile.subscription_status === 'trial' && 
                         trialEndsAt !== null && 
                         trialEndsAt > now;

          setStatus({
            isActive: profile.subscription_status === 'active',
            isTrial,
            trialEndsAt,
            daysLeft,
            subscriptionStatus: profile.subscription_status,
            loading: false,
          });
        } else {
          setStatus(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error('Feil ved henting av abonnement:', error);
        setStatus(prev => ({ ...prev, loading: false }));
      }
    };

    fetchSubscription();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchSubscription();
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return status;
}
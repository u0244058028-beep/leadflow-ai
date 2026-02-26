import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface PurchaseStatus {
  hasAccess: boolean;
  expiresAt: Date | null;
  daysLeft: number | null;
  loading: boolean;
}

export function usePurchase() {
  const [status, setStatus] = useState<PurchaseStatus>({
    hasAccess: false,
    expiresAt: null,
    daysLeft: null,
    loading: true,
  });

  useEffect(() => {
    const fetchPurchaseStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setStatus({ ...status, loading: false });
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('has_active_purchase, purchase_expires_at')
          .eq('id', user.id)
          .single();

        if (profile) {
          const expiresAt = profile.purchase_expires_at ? new Date(profile.purchase_expires_at) : null;
          const now = new Date();
          
          const hasAccess = profile.has_active_purchase && 
                           expiresAt !== null && 
                           expiresAt > now;

          const daysLeft = hasAccess && expiresAt
            ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
            : null;

          setStatus({
            hasAccess,
            expiresAt,
            daysLeft,
            loading: false,
          });
        }
      } catch (error) {
        console.error('Error:', error);
        setStatus({ ...status, loading: false });
      }
    };

    fetchPurchaseStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchPurchaseStatus();
    });

    return () => subscription?.unsubscribe();
  }, []);

  return status;
}
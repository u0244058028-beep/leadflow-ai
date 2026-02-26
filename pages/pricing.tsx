import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';
import Button from '@/components/Button';
import { useToast } from '@/components/Toast';

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasActiveAccess, setHasActiveAccess] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    const checkUserStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('has_active_purchase, purchase_expires_at')
          .eq('id', user.id)
          .single();

        if (profile) {
          const now = new Date();
          const expiresAt = profile.purchase_expires_at ? new Date(profile.purchase_expires_at) : null;
          setHasActiveAccess(
            profile.has_active_purchase && 
            expiresAt !== null && 
            expiresAt > now
          );
        }
      }
    };

    checkUserStatus();
  }, []);

  const handlePurchase = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login?redirect=pricing');
        return;
      }

      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id,
          email: user.email 
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Something went wrong');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error:', error);
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    'Unlimited leads',
    'AI-generated landing pages',
    'AI lead scoring',
    'Smart follow-up messages',
    'Pipeline value tracking',
    'Email tracking',
    'Task management',
    'Priority support',
  ];

  const getButtonText = () => {
    if (!isLoggedIn) return 'Start 14-day free trial';
    if (hasActiveAccess) return 'You already have access';
    return 'Purchase Access - $29';
  };

  const getDescriptionText = () => {
    if (!isLoggedIn) return 'Start your 14-day free trial. No credit card required.';
    if (hasActiveAccess) return 'You already have active access.';
    return 'Get 30 days of full access for just $29.';
  };

  if (hasActiveAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">You already have access!</h1>
          <p className="text-xl text-gray-600 mb-8">
            You have an active purchase. Visit your profile to see when it expires.
          </p>
          <Button onClick={() => router.push('/profile')}>
            Go to Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Simple, one-time pricing</h1>
          <p className="text-xl text-gray-600">{getDescriptionText()}</p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-blue-500 relative">
            <span className="absolute top-0 -translate-y-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold left-1/2 -translate-x-1/2">
              Most popular
            </span>
            
            <h3 className="text-2xl font-bold text-center mb-2">Pro Access</h3>
            <div className="text-center mb-6">
              <span className="text-5xl font-bold">$29</span>
              <span className="text-gray-600"> / 30 days</span>
            </div>
            
            <ul className="space-y-4 mb-8">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
            
            <Button
              onClick={handlePurchase}
              loading={loading}
              fullWidth
              size="lg"
              className="mb-4"
              disabled={hasActiveAccess}
            >
              {getButtonText()}
            </Button>
            
            <p className="text-sm text-gray-500 text-center">
              One-time payment. Access for 30 days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
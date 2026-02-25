import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';
import Button from '@/components/Button';
import { useToast } from '@/components/Toast';

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleSubscribe = async () => {
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
        throw new Error('Kunne ikke opprette checkout-sesjon');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Feil:', error);
      showToast('Noe gikk galt. Prøv igjen.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    'Ubegrenset leads',
    'AI-genererte landingssider',
    'AI lead scoring',
    'Smarte oppfølgingsmeldinger',
    'Pipeline verdi-sporing',
    'E-post tracking',
    'Task management',
    'Prioritert support',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Enkel prising for vekst
          </h1>
          <p className="text-xl text-gray-600">
            Start gratis i 14 dager. Ingen kredittkort påkrevd.
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-blue-500 relative">
            <span className="absolute top-0 -translate-y-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold left-1/2 -translate-x-1/2">
              Mest populær
            </span>
            
            <h3 className="text-2xl font-bold text-center mb-2">Pro</h3>
            <div className="text-center mb-6">
              <span className="text-5xl font-bold">$29</span>
              <span className="text-gray-600"> / måned</span>
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
              onClick={handleSubscribe}
              loading={loading}
              fullWidth
              size="lg"
              className="mb-4"
            >
              Start 14 dagers gratis prøveperiode
            </Button>
            
            <p className="text-sm text-gray-500 text-center">
              Ingen binding. Kanseller når som helst.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
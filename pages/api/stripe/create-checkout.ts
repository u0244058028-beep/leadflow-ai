import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Sett CORS-headere
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Håndter preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Bare sjekk miljøvariabler - ingen Stripe eller Supabase
  const envCheck = {
    NODE_ENV: process.env.NODE_ENV,
    hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
    secretKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7) || 'ikke satt',
    hasPublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    hasPriceId: !!process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY,
    priceIdValue: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY || 'ikke satt',
    hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
    appUrlValue: process.env.NEXT_PUBLIC_APP_URL || 'ikke satt',
    allEnvKeys: Object.keys(process.env).filter(key => 
      key.includes('STRIPE') || key.includes('NEXT_PUBLIC')
    )
  };

  // Returner ALL informasjon
  return res.status(200).json({
    message: 'Environment check',
    env: envCheck,
    timestamp: new Date().toISOString()
  });
}
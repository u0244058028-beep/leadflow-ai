import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, email, message } = req.body;

    // Her kan du sende e-post via Resend eller lignende
    console.log('Kontaktmelding mottatt:', { name, email, message });

    // Foreløpig bare logg og svar OK
    res.status(200).json({ message: 'Message received' });
  } catch (error) {
    console.error('Contact API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Hent IP-adresse (håndterer både direkt og proxy)
  const forwarded = req.headers['x-forwarded-for']
  const ipAddress = forwarded 
    ? (typeof forwarded === 'string' ? forwarded : forwarded[0]) 
    : req.socket.remoteAddress || 'Unknown'

  // Hent user agent
  const userAgent = req.headers['user-agent'] || 'Unknown'

  res.status(200).json({ ipAddress, userAgent })
}
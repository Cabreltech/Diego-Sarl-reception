import type { ApiRequest, ApiResponse } from './_types.js';

export default function handler(req: ApiRequest, res: ApiResponse) {
  const providedKey = (req.query.key as string) || (req.headers['x-admin-key'] as string);
  const secureKey = process.env.SECURE_KEY || 'diegosas';

  if (providedKey !== secureKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return res.status(200).json({
    isConnected: false,
    hasQR: false,
    whatsappRetryCount: 0,
    isConflictState: false,
    note: 'WhatsApp bot daemon requires a continuous server/container (Docker / VPS / Railway). On Vercel, customer orders dispatch directly via direct WhatsApp wa.me links.'
  });
}

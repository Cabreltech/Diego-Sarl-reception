import type { ApiRequest, ApiResponse } from './_types.js';

export default function handler(req: ApiRequest, res: ApiResponse) {
  const providedKey = (req.query.key as string) || (req.headers['x-admin-key'] as string);
  const secureKey = process.env.SECURE_KEY || 'diegosas';

  if (providedKey && providedKey === secureKey) {
    return res.status(200).json({ valid: true });
  }
  return res.status(200).json({ valid: false });
}

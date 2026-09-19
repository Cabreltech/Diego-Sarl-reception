import type { ApiRequest, ApiResponse } from './_types.js';
import { getOrders } from './_store.js';

export default function handler(req: ApiRequest, res: ApiResponse) {
  const providedKey = (req.query.key as string) || (req.headers['x-admin-key'] as string);
  const secureKey = process.env.SECURE_KEY || 'diegosas';

  if (providedKey !== secureKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const orders = getOrders();
  const status = req.query.status as string;
  let filtered = orders;
  if (status && status !== 'all') {
    filtered = orders.filter((o) => o.status === status);
  }
  const unreadCount = orders.filter((o) => o.status === 'nouveau').length;

  return res.status(200).json({
    success: true,
    orders: filtered,
    totalCount: orders.length,
    unreadCount,
  });
}

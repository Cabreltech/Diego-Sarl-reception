// Simple serverless in-memory store for Vercel demo/fallback
// In a serverless environment, memory resets across cold starts.
// For durable production storage, connect Upstash Redis or Supabase/PostgreSQL.

export interface OrderItem {
  id: string;
  nomClient: string;
  phone: string;
  natureEvenement: string;
  dateEvenement: string;
  lieuEvenement: string;
  nombreFuts: number;
  marquesSouhaitees: string;
  heurePrestation: string;
  createdAt: string;
  status: 'nouveau' | 'en_cours' | 'confirme' | 'livre' | 'annule';
  notes: string;
  whatsappSent: boolean;
}

declare global {
  var __GLOBAL_ORDERS__: OrderItem[] | undefined;
  var __GLOBAL_CONFIG__: { receptionistNumber?: string } | undefined;
}

export function getOrders(): OrderItem[] {
  if (!global.__GLOBAL_ORDERS__) {
    global.__GLOBAL_ORDERS__ = [];
  }
  return global.__GLOBAL_ORDERS__;
}

export function saveOrder(order: OrderItem): void {
  const list = getOrders();
  list.unshift(order);
}

export function getStoredConfig(): { receptionistNumber?: string } {
  if (!global.__GLOBAL_CONFIG__) {
    global.__GLOBAL_CONFIG__ = {};
  }
  return global.__GLOBAL_CONFIG__;
}

export function saveStoredConfig(newConf: { receptionistNumber?: string }): void {
  const current = getStoredConfig();
  global.__GLOBAL_CONFIG__ = { ...current, ...newConf };
}

export function formatCameroonPhone(phone: string): string {
  let clean = (phone || '').replace(/[^0-9]/g, '');
  if (clean.startsWith('00237')) clean = clean.slice(5);
  if (clean.startsWith('237')) return clean;
  if (clean.length === 9) return '237' + clean;
  return clean;
}

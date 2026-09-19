export interface LeadFormData {
  nomClient: string;
  phone: string;
  natureEvenement: string;
  dateEvenement: string;
  lieuEvenement: string;
  nombreFuts: number;
  marquesSouhaitees: string;
  heurePrestation: string;
}

export type OrderStatus = 'nouveau' | 'en_cours' | 'confirme' | 'livre' | 'annule';

export interface OrderItem extends LeadFormData {
  id: string;
  createdAt: string;
  status: OrderStatus;
  notes?: string;
  whatsappSent?: boolean;
}

export interface WhatsAppStatus {
  isConnected: boolean;
  hasQR: boolean;
  whatsappRetryCount?: number;
  isConflictState?: boolean;
}


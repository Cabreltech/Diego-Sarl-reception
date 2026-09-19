import type { ApiRequest, ApiResponse } from './_types.js';
import { saveOrder, formatCameroonPhone, getStoredConfig, OrderItem } from './_store.js';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const leadData = req.body || {};
  const conf = getStoredConfig();
  const receptionistConfig = conf.receptionistNumber || process.env.RECEPTIONIST_NUMBER || '';

  const orderId = `CMD-${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
  const newOrder: OrderItem = {
    id: orderId,
    nomClient: leadData.nomClient || 'Client Inconnu',
    phone: leadData.phone || '',
    natureEvenement: leadData.natureEvenement || '',
    dateEvenement: leadData.dateEvenement || '',
    lieuEvenement: leadData.lieuEvenement || '',
    nombreFuts: Number(leadData.nombreFuts) || 1,
    marquesSouhaitees: leadData.marquesSouhaitees || '',
    heurePrestation: leadData.heurePrestation || '',
    createdAt: new Date().toISOString(),
    status: 'nouveau',
    notes: '',
    whatsappSent: false,
  };

  saveOrder(newOrder);

  const rawRecipients = (receptionistConfig || '695591420')
    .split(/[,; ]+/)
    .map((n) => formatCameroonPhone(n))
    .filter((n) => n.length >= 9);

  const primaryReceptionist = rawRecipients[0] || '237695591420';

  const waDirectMessage = [
    `🌟 *NOUVELLE COMMANDE BIÈRE PRESSION - DIEGO SAS* 🌟`,
    `📋 *Réf:* ${orderId}`,
    ``,
    `👤 *Client:* ${leadData.nomClient}`,
    `📞 *Téléphone:* ${leadData.phone}`,
    `🎉 *Événement:* ${leadData.natureEvenement}`,
    `📅 *Date:* ${leadData.dateEvenement} à ${leadData.heurePrestation}`,
    `📍 *Lieu:* ${leadData.lieuEvenement}`,
    `🍺 *Quantité:* ${leadData.nombreFuts} fûts`,
    `🏷️ *Marques:* ${leadData.marquesSouhaitees}`,
    ``,
    `_Bonjour la Réception, je confirme ma réservation pour la bière pression passée sur le site Diego._`,
  ].join('\n');

  const directWhatsAppUrl = `https://wa.me/${primaryReceptionist}?text=${encodeURIComponent(waDirectMessage)}`;

  return res.status(200).json({
    success: true,
    message: 'Commande enregistrée et transmise à la réception',
    order: newOrder,
    directWhatsAppUrl,
    receptionistNumber: primaryReceptionist,
    details: {
      inbox: 'saved',
      orderId,
      whatsapp: 'direct_link_ready',
    },
  });
}

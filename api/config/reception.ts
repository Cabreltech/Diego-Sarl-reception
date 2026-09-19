import type { ApiRequest, ApiResponse } from '../_types.js';
import { getStoredConfig, saveStoredConfig, formatCameroonPhone } from '../_store.js';

export default function handler(req: ApiRequest, res: ApiResponse) {
  const method = req.method || 'GET';

  if (method === 'POST') {
    const key = (req.query?.key as string) || (req.headers?.['x-admin-key'] as string) || '';
    const validKey = process.env.SECURE_KEY || 'diegosas';
    if (!key || key !== validKey) {
      return res.status(401).json({ error: 'Unauthorized: Invalid admin key' });
    }

    const { receptionistNumber } = req.body || {};
    if (!receptionistNumber || typeof receptionistNumber !== 'string') {
      return res.status(400).json({ error: 'Numéro de réception invalide' });
    }

    const formatted = formatCameroonPhone(receptionistNumber.trim());
    if (formatted.length < 9) {
      return res.status(400).json({ error: 'Numéro de téléphone trop court ou invalide' });
    }

    saveStoredConfig({ receptionistNumber: formatted });
    return res.status(200).json({
      success: true,
      receptionistNumber: formatted,
      message: 'Numéro de la réception mis à jour avec succès',
    });
  }

  // GET
  const conf = getStoredConfig();
  const rawNumbers = conf.receptionistNumber || process.env.RECEPTIONIST_NUMBER || '695591420';
  const primaryNumber = rawNumbers.split(/[,; ]+/).map((n) => formatCameroonPhone(n)).filter(Boolean)[0] || '237695591420';

  return res.status(200).json({
    receptionistNumber: primaryNumber,
    isWhatsAppConnected: false,
  });
}

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle2, 
  MessageCircle, 
  RotateCcw, 
  ShieldCheck, 
  Sparkles,
  PhoneCall,
  Beer,
  Truck,
  Calendar,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { LeadFormData } from '../types';

interface SuccessCardProps {
  leadSummary: LeadFormData | null;
  orderId?: string | null;
  directWhatsAppUrl?: string | null;
  receptionistPhone?: string | null;
  onReset: () => void;
}

export const SuccessCard: React.FC<SuccessCardProps> = ({ 
  leadSummary, 
  orderId,
  directWhatsAppUrl,
  receptionistPhone,
  onReset 
}) => {
  const [receptionNumber, setReceptionNumber] = useState<string>(receptionistPhone || '237695591420');

  useEffect(() => {
    if (receptionistPhone) {
      setReceptionNumber(receptionistPhone);
    } else {
      fetch('/api/config/reception')
        .then((res) => res.json())
        .then((data) => {
          if (data.receptionistNumber) {
            setReceptionNumber(data.receptionistNumber);
          }
        })
        .catch(() => {});
    }
  }, [receptionistPhone]);

  const targetUrl = React.useMemo(() => {
    if (directWhatsAppUrl) return directWhatsAppUrl;
    if (!leadSummary) return `https://wa.me/${receptionNumber}`;
    
    const cleanNum = receptionNumber.replace(/[^0-9]/g, '');
    const target = cleanNum.startsWith('237') ? cleanNum : '237' + cleanNum;
    const msg = [
      `🌟 *COMMANDE BIÈRE PRESSION - DIEGO SAS* 🌟`,
      orderId ? `📋 *Réf:* ${orderId}` : ``,
      ``,
      `👤 *Client :* ${leadSummary.nomClient}`,
      `📞 *Téléphone :* ${leadSummary.phone}`,
      `🎉 *Événement :* ${leadSummary.natureEvenement}`,
      `📅 *Date :* ${leadSummary.dateEvenement} à ${leadSummary.heurePrestation}`,
      `📍 *Lieu :* ${leadSummary.lieuEvenement}`,
      `🍺 *Quantité :* ${leadSummary.nombreFuts} fûts`,
      `🏷️ *Marques :* ${leadSummary.marquesSouhaitees}`,
      ``,
      `_Bonjour la Réception, voici les informations de ma réservation passée sur le site Diego._`
    ].filter(Boolean).join('\n');

    return `https://wa.me/${target}?text=${encodeURIComponent(msg)}`;
  }, [directWhatsAppUrl, leadSummary, orderId, receptionNumber]);

  // Formatted telephone display: +237 695 59 14 20
  const formatDisplayPhone = (raw: string) => {
    const clean = raw.replace(/[^0-9]/g, '');
    if (clean.length === 12 && clean.startsWith('237')) {
      return `+237 ${clean.slice(3, 6)} ${clean.slice(6, 8)} ${clean.slice(8, 10)} ${clean.slice(10, 12)}`;
    }
    if (clean.length === 9) {
      return `+237 ${clean.slice(0, 3)} ${clean.slice(3, 5)} ${clean.slice(5, 7)} ${clean.slice(7, 9)}`;
    }
    return clean ? `+${clean}` : '+237 695 59 14 20';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -15 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="glass-panel-dark rounded-3xl p-6 sm:p-8 space-y-6 text-slate-100"
    >
      {/* Success Header */}
      <div className="flex flex-col items-center text-center space-y-2.5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xl shadow-emerald-500/25 ring-4 ring-emerald-500/20">
          <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-extrabold tracking-wide uppercase">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Réservation Enregistrée avec Succès</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Merci {leadSummary?.nomClient || ''} !
        </h2>

        <p className="text-xs sm:text-sm text-slate-300 max-w-sm leading-relaxed">
          Votre demande de bière pression a été transmise instantanément à la réception de <strong className="text-white">Diego SAS</strong>.
        </p>
      </div>

      {/* Confirmation & Reassurance Box */}
      <div className="bg-emerald-950/70 border border-emerald-500/30 rounded-2xl p-4 space-y-2 text-xs">
        <div className="flex items-center gap-2 font-black text-emerald-300">
          <PhoneCall className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Prochaine étape :</span>
        </div>
        <p className="text-emerald-100/90 leading-relaxed text-[11px]">
          Notre équipe réceptionne votre commande et va vous recontacter directement au{' '}
          <strong className="font-extrabold text-white underline decoration-emerald-400 decoration-2">{leadSummary?.phone || 'votre numéro'}</strong> pour confirmer l'horaire précis de livraison et d'installation de votre tireuse.
        </p>
      </div>

      {/* Order Recap Receipt */}
      {leadSummary && (
        <div className="bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-slate-700/80 space-y-3.5 text-xs shadow-inner">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 font-bold">
            <span className="text-slate-400 text-[11px] uppercase tracking-wider font-extrabold">
              Récapitulatif de votre commande
            </span>
            {orderId && (
              <span className="text-diego-light-orange font-mono font-black bg-orange-500/10 px-2.5 py-0.5 rounded-lg border border-orange-500/30 text-xs">
                {orderId}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block text-[9px] uppercase font-bold">Client</span>
              <span className="font-bold text-white">{leadSummary.nomClient}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] uppercase font-bold">Téléphone</span>
              <span className="font-bold text-white">{leadSummary.phone}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] uppercase font-bold">Événement</span>
              <span className="font-bold text-white">{leadSummary.natureEvenement}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[9px] uppercase font-bold">Volume</span>
              <span className="font-bold text-diego-light-orange">{leadSummary.nombreFuts} fûts de bière</span>
            </div>
          </div>

          <div className="pt-2 text-xs border-t border-slate-800">
            <span className="text-slate-500 block text-[9px] uppercase font-bold mb-1">Marques & Répartition</span>
            <span className="font-bold text-white leading-relaxed">{leadSummary.marquesSouhaitees}</span>
          </div>

          <div className="pt-2 text-xs border-t border-slate-800 flex items-start gap-2 text-slate-300">
            <MapPin className="w-4 h-4 text-diego-orange shrink-0 mt-0.5" />
            <span>
              <strong className="text-white">{leadSummary.lieuEvenement}</strong> • le {leadSummary.dateEvenement} à {leadSummary.heurePrestation}
            </span>
          </div>
        </div>
      )}

      {/* Value Badges */}
      <div className="grid grid-cols-2 gap-2.5 text-xs">
        <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800 flex items-center gap-2.5">
          <Truck className="w-4 h-4 text-diego-light-orange shrink-0" />
          <span className="text-slate-300 text-[11px] font-bold leading-tight">
            Livraison & tireuse incluses
          </span>
        </div>
        <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800 flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="text-slate-300 text-[11px] font-bold leading-tight">
            Assistance Pro Diego SAS
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 space-y-3">
        {/* Reset / New Order Button */}
        <button
          onClick={onReset}
          id="new-order-btn"
          className="w-full min-h-[50px] px-4 py-2.5 bg-gradient-to-r from-diego-orange to-orange-500 hover:brightness-105 active:scale-[0.98] text-white font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/20 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Passer une autre commande</span>
        </button>

        {/* Optional WhatsApp manual contact */}
        <div className="text-center pt-1">
          <a
            href={targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 font-semibold transition-colors py-1 px-2"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>Besoin de nous écrire ? Ouvrir WhatsApp ({formatDisplayPhone(receptionNumber)})</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </a>
        </div>
      </div>
    </motion.div>
  );
};

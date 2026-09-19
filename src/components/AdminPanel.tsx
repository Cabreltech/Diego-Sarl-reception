import React from 'react';
import { motion } from 'motion/react';
import {
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle2,
  QrCode,
  Loader2,
  RefreshCw,
  X,
  ExternalLink
} from 'lucide-react';
import { WhatsAppStatus } from '../types';

interface AdminPanelProps {
  waStatus: WhatsAppStatus | null;
  qrDataURL: string | null;
  isResetting: boolean;
  onResetWhatsApp: () => void;
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  waStatus,
  qrDataURL,
  isResetting,
  onResetWhatsApp,
  onClose,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="bg-white rounded-3xl border border-neutral-200/80 shadow-xl overflow-hidden mb-6"
    >
      {/* Panel Top Header */}
      <div className="bg-neutral-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-diego-orange animate-pulse" />
          <h2 className="text-xs font-black uppercase tracking-wider text-neutral-200">
            Console d'Administration
          </h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 sm:p-5 space-y-5">
        {/* WhatsApp Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-extrabold text-xs uppercase tracking-wide text-neutral-600 flex items-center gap-2">
              <Wifi className="w-4 h-4 text-diego-blue" />
              Service WhatsApp
            </span>
            {waStatus?.isConnected ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Connecté
              </span>
            ) : waStatus?.isConflictState ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 animate-pulse">
                Conflit (440)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                Déconnecté
              </span>
            )}
          </div>

          {/* Conflict 440 Box */}
          {waStatus?.isConflictState && (
            <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl space-y-2.5 text-amber-950">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <p className="font-bold text-amber-900">Conflit de session détecté (440)</p>
                  <p className="text-amber-800 text-[11px] mt-0.5">
                    WhatsApp Web est ouvert ailleurs ou une session concurrente est active.
                  </p>
                </div>
              </div>
              <button
                id="admin-reset-wa-conflict-btn"
                onClick={onResetWhatsApp}
                disabled={isResetting}
                className="w-full py-2.5 px-3 bg-amber-600 active:bg-amber-700 hover:bg-amber-700 disabled:bg-amber-400 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Réinitialisation en cours...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    Réinitialiser & Obtenir un nouveau QR
                  </>
                )}
              </button>
            </div>
          )}

          {/* QR Code view */}
          {!waStatus?.isConnected && !waStatus?.isConflictState && (
            <div className="flex flex-col items-center gap-3 p-4 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
              <p className="text-xs font-extrabold text-neutral-700 text-center">
                Scannez avec WhatsApp sur votre smartphone
              </p>
              <p className="text-[11px] text-neutral-500 text-center max-w-xs">
                Ouvrez WhatsApp &gt; Réglages &gt; Appareils connectés &gt; Connecter un appareil
              </p>

              {qrDataURL ? (
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-neutral-100">
                  <img
                    src={qrDataURL}
                    alt="Code QR WhatsApp"
                    className="w-44 h-44 sm:w-48 sm:h-48 object-contain"
                  />
                </div>
              ) : (
                <div className="w-44 h-44 sm:w-48 sm:h-48 bg-neutral-100 animate-pulse rounded-2xl flex flex-col items-center justify-center gap-2">
                  <QrCode className="w-8 h-8 text-neutral-300" />
                  <span className="text-[10px] font-bold text-neutral-400">Génération du code...</span>
                </div>
              )}
              <p className="text-[10px] text-neutral-400 text-center italic">
                Actualisation automatique toutes les 20 secondes.
              </p>
            </div>
          )}

          {/* Connected State */}
          {waStatus?.isConnected && (
            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200/80 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-emerald-900">Notifications opérationnelles</p>
                <p className="text-[11px] text-emerald-700 leading-relaxed mt-0.5">
                  Chaque nouvelle réservation sera transmise instantanément via WhatsApp.
                </p>
                <button
                  id="admin-disconnect-wa-btn"
                  onClick={onResetWhatsApp}
                  disabled={isResetting}
                  className="mt-2.5 text-[10px] font-extrabold text-emerald-900/80 hover:text-red-600 uppercase tracking-wider underline transition-colors"
                >
                  {isResetting ? 'Déconnexion...' : 'Déconnecter / Changer de numéro'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

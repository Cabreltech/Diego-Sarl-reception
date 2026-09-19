import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Smartphone,
  QrCode,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  Loader2,
  ExternalLink,
  ShieldCheck,
  HelpCircle,
  Info,
  Phone,
  Save,
  Check
} from 'lucide-react';
import { WhatsAppStatus } from '../types';

interface WhatsAppConnectProps {
  adminKey: string | null;
  waStatus: WhatsAppStatus | null;
  qrDataURL: string | null;
  isResetting: boolean;
  onResetWhatsApp: () => void;
  onRefreshStatus: () => void;
}

export const WhatsAppConnect: React.FC<WhatsAppConnectProps> = ({
  adminKey,
  waStatus,
  qrDataURL,
  isResetting,
  onResetWhatsApp,
  onRefreshStatus
}) => {
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [receptionNumber, setReceptionNumber] = useState<string>('237695591420');
  const [countdown, setCountdown] = useState<number>(20);

  // Receptionist phone configuration state
  const [inputPhone, setInputPhone] = useState<string>('');
  const [isSavingPhone, setIsSavingPhone] = useState<boolean>(false);
  const [phoneSaveResult, setPhoneSaveResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetch('/api/config/reception')
      .then((res) => res.json())
      .then((data) => {
        if (data.receptionistNumber) {
          setReceptionNumber(data.receptionistNumber);
          setInputPhone(data.receptionistNumber);
        }
      })
      .catch(() => {});
  }, [adminKey]);

  // Countdown timer for QR refresh
  useEffect(() => {
    if (waStatus?.isConnected) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onRefreshStatus();
          return 20;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [waStatus?.isConnected, onRefreshStatus]);

  const handleSaveReceptionNumber = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!adminKey) return;
    setIsSavingPhone(true);
    setPhoneSaveResult(null);

    try {
      const res = await fetch(`/api/config/reception?key=${encodeURIComponent(adminKey)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({ receptionistNumber: inputPhone }),
      });
      
      let data: any = null;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        if (text) {
          try {
            data = JSON.parse(text);
          } catch {
            data = { error: text };
          }
        }
      }

      if (res.ok && data?.success) {
        setReceptionNumber(data.receptionistNumber);
        setInputPhone(data.receptionistNumber);
        setPhoneSaveResult({
          success: true,
          message: 'Numéro de réception enregistré avec succès ! Toutes les futures commandes seront reçues à ce numéro.',
        });
      } else {
        setPhoneSaveResult({
          success: false,
          message: data?.error || `Erreur lors de la sauvegarde (Code: ${res.status}). Veuillez redémarrer le serveur si vous venez d'appliquer la mise à jour.`,
        });
      }
    } catch (err: any) {
      setPhoneSaveResult({
        success: false,
        message: err.message || 'Erreur de connexion avec le serveur.',
      });
    } finally {
      setIsSavingPhone(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!adminKey) return;
    setTestSending(true);
    setTestResult(null);
    try {
      const res = await fetch(`/api/whatsapp-test?key=${encodeURIComponent(adminKey)}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setTestResult({ success: true, message: data.message || 'Message test envoyé avec succès !' });
      } else {
        setTestResult({ success: false, message: data.error || 'Erreur lors de l\'envoi du message' });
      }
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || 'Erreur réseau' });
    } finally {
      setTestSending(false);
    }
  };

  const formatDisplayPhone = (raw: string) => {
    const clean = (raw || '').replace(/[^0-9]/g, '');
    if (clean.length === 12 && clean.startsWith('237')) {
      return `+237 ${clean.slice(3, 6)} ${clean.slice(6, 8)} ${clean.slice(8, 10)} ${clean.slice(10, 12)}`;
    }
    if (clean.length === 9) {
      return `+237 ${clean.slice(0, 3)} ${clean.slice(3, 5)} ${clean.slice(5, 7)} ${clean.slice(7, 9)}`;
    }
    return clean ? `+${clean}` : '+237 695 59 14 20';
  };

  return (
    <div className="space-y-5 mb-8">
      {/* 1. Receptionist Number Configuration Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-diego-orange shadow-2xs">
              <Phone className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-base font-black text-neutral-900">
                Numéro WhatsApp de la Réception (Commandes)
              </h2>
              <p className="text-xs text-neutral-500">
                Définissez ou modifiez le numéro de téléphone qui recevra toutes les alertes et commandes des clients
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full text-xs font-black">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Actuel : {formatDisplayPhone(receptionNumber)}</span>
          </div>
        </div>

        <form onSubmit={handleSaveReceptionNumber} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400 font-bold text-xs">
                +237
              </div>
              <input
                type="text"
                id="receptionist-phone-input"
                value={inputPhone.replace(/^(\+237|237)/, '')}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setInputPhone(val ? `237${val}` : '');
                }}
                placeholder="Ex: 695 59 14 20"
                maxLength={12}
                className="w-full pl-14 pr-4 py-3 bg-neutral-50 border border-neutral-300 rounded-2xl text-sm font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-diego-blue/30 focus:border-diego-blue transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingPhone || !inputPhone.trim()}
              id="save-receptionist-phone-btn"
              className="px-6 py-3 bg-neutral-900 hover:bg-neutral-800 active:scale-[0.98] text-white text-xs font-black uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSavingPhone ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Enregistrer le numéro</span>
                </>
              )}
            </button>
          </div>

          <div className="text-[11px] text-neutral-500 flex items-center gap-1.5 pl-1">
            <Info className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span>
              Entrez le numéro camerounais (9 chiffres, ex: <strong>695591420</strong>). Ce numéro est instantanément synchronisé pour la redirection client et les messages WhatsApp automatiques.
            </span>
          </div>

          {phoneSaveResult && (
            <div
              className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 transition-all ${
                phoneSaveResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {phoneSaveResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <span className="font-medium">{phoneSaveResult.message}</span>
            </div>
          )}
        </form>
      </div>
      {/* Overview Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs">
              <Smartphone className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-base font-black text-neutral-900">
                Connexion WhatsApp Réception
              </h2>
              <p className="text-xs text-neutral-500">
                Liez le compte WhatsApp de Diego SAS pour recevoir les commandes des clients en direct
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefreshStatus}
              title="Rafraîchir l'état"
              className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Actualiser</span>
            </button>
          </div>
        </div>

        {/* Current State Display */}
        {waStatus?.isConnected ? (
          /* CONNECTED STATE */
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30">
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-black text-emerald-900">
                    Compte WhatsApp Connecté et Opérationnel
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-200/70 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                    Actif
                  </span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Le système est relié à votre compte WhatsApp. Chaque nouvelle réservation de bière pression est instantanément notifiée.
                </p>
                <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-emerald-900">
                  <span>Numéro de réception configuré :</span>
                  <strong className="font-mono bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                    {formatDisplayPhone(receptionNumber)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Test Action & Disconnect */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={handleSendTestMessage}
                disabled={testSending}
                id="send-test-wa-btn"
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                {testSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Envoi du test en cours...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Envoyer un message test sur mon WhatsApp</span>
                  </>
                )}
              </button>

              <button
                onClick={onResetWhatsApp}
                disabled={isResetting}
                id="disconnect-wa-btn"
                className="py-2.5 px-4 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border border-red-200 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all"
              >
                {isResetting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>Déconnecter / Changer d'appareil</span>
                )}
              </button>
            </div>

            {/* Test Message Result Alert */}
            {testResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-emerald-100/80 border-emerald-300 text-emerald-900'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        ) : waStatus?.isConflictState ? (
          /* CONFLICT (440) STATE */
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-black text-amber-900">
                  Conflit de session détecté (Erreur 440)
                </h3>
                <p className="text-xs text-amber-800 leading-relaxed">
                  WhatsApp Web ou une autre session connectée est actuellement ouverte sur un autre navigateur. Pour reconnecter cette console Diego SAS, réinitialisez la session ci-dessous.
                </p>
              </div>
            </div>

            <button
              onClick={onResetWhatsApp}
              disabled={isResetting}
              className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              {isResetting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Réinitialisation en cours...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Réinitialiser la session & Afficher un nouveau QR Code</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* PAIRING / QR CODE NEEDED */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Steps on Left */}
            <div className="md:col-span-7 space-y-4 text-neutral-700">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-diego-blue text-[11px] font-extrabold uppercase tracking-wider border border-blue-200/70">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Procédure de Connexion WhatsApp</span>
              </div>

              <h3 className="text-sm font-black text-neutral-900">
                Scannez le QR Code avec le smartphone de la réception :
              </h3>

              <ol className="space-y-3 text-xs">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-diego-blue text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <span>Ouvrez <strong>WhatsApp</strong> sur votre smartphone de service.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-diego-blue text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Accédez aux <strong>Réglages</strong> (sur iPhone) ou appuyez sur le <strong>menu 3 points</strong> (sur Android), puis sélectionnez <strong>Appareils connectés</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-diego-blue text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    Touchez <strong>Connecter un appareil</strong> et pointez la caméra vers le code ci-contre.
                  </span>
                </li>
              </ol>

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 text-[11px] text-neutral-500 flex items-start gap-2">
                <Info className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                <span>
                  Numéro de réception ciblé par défaut : <strong className="text-neutral-800">{formatDisplayPhone(receptionNumber)}</strong>. Même si le serveur attend le jumelage, les clients sont automatiquement dirigés vers WhatsApp lors de la commande.
                </span>
              </div>
            </div>

            {/* QR Code Container on Right */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-5 bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-200 space-y-3">
              {qrDataURL ? (
                <div className="bg-white p-3.5 rounded-2xl shadow-md border border-neutral-200/80">
                  <img
                    src={qrDataURL}
                    alt="WhatsApp Pairing QR Code"
                    className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                  />
                </div>
              ) : (
                <div className="w-48 h-48 sm:w-52 sm:h-52 bg-white rounded-2xl border border-neutral-200 flex flex-col items-center justify-center gap-2 p-4 text-center">
                  <Loader2 className="w-8 h-8 text-diego-orange animate-spin" />
                  <span className="text-xs font-bold text-neutral-500">
                    Génération du QR Code...
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    Initialisation du module WhatsApp
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between w-full max-w-[210px] text-[11px] text-neutral-500">
                <span>Renouvellement :</span>
                <span className="font-mono font-black text-neutral-800 bg-neutral-200/70 px-2 py-0.5 rounded">
                  {countdown}s
                </span>
              </div>

              <button
                onClick={onResetWhatsApp}
                disabled={isResetting}
                className="w-full max-w-[210px] py-2 px-3 bg-neutral-200 hover:bg-neutral-300 active:scale-[0.98] text-neutral-800 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                <span>Forcer un nouveau code</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Canaux de Réception des Commandes Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/90 shadow-sm space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-neutral-500 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-diego-blue" />
          <span>Canaux de Réception des Commandes</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-4 rounded-2xl border border-neutral-200/70 bg-neutral-50/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-800">Redirection Directe Client</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                Active 100%
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 leading-snug">
              Chaque réservation validée par un client ouvre automatiquement une discussion WhatsApp pré-remplie vers le numéro de réception ({formatDisplayPhone(receptionNumber)}).
            </p>
          </div>

          <div className="p-4 rounded-2xl border border-neutral-200/70 bg-neutral-50/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-800">Boîte de Réception Commandes</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                Intégrée
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 leading-snug">
              Toutes les demandes sont conservées avec alertes sonores et statuts de traitement dans l'onglet « Commandes ».
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

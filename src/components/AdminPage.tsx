import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Inbox,
  Smartphone,
  LogOut,
  Globe,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowLeft
} from 'lucide-react';
import { OrdersInbox } from './OrdersInbox';
import { WhatsAppConnect } from './WhatsAppConnect';
import { WhatsAppStatus } from '../types';

interface AdminPageProps {
  onNavigateToClient: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigateToClient }) => {
  const [adminKey, setAdminKey] = useState<string | null>(() => {
    return localStorage.getItem('diego_admin_key');
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(true);
  const [keyInput, setKeyInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Tab state in admin
  const [activeTab, setActiveTab] = useState<'orders' | 'whatsapp'>('orders');

  // WhatsApp and System Status
  const [waStatus, setWaStatus] = useState<WhatsAppStatus | null>(null);
  const [qrDataURL, setQrDataURL] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const verifyKey = useCallback(async (key: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/verify-admin-key?key=${encodeURIComponent(key)}`);
      const data = await res.json();
      if (data.valid) {
        setIsAuthenticated(true);
        setAdminKey(key);
        localStorage.setItem('diego_admin_key', key);
        setAuthError(null);
        return true;
      } else {
        setIsAuthenticated(false);
        setAdminKey(null);
        localStorage.removeItem('diego_admin_key');
        setAuthError("Clé d'accès incorrecte. Veuillez réessayer.");
        return false;
      }
    } catch {
      setIsAuthenticated(false);
      setAuthError("Impossible de joindre le serveur. Vérifiez votre connexion.");
      return false;
    }
  }, []);

  // Auto login via query parameter or stored session key
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const keyInUrl = params.get('id') || params.get('key');
    const keyToTest = keyInUrl || adminKey;

    if (keyToTest) {
      verifyKey(keyToTest).finally(() => setIsVerifying(false));
    } else {
      setIsVerifying(false);
    }
  }, [adminKey, verifyKey]);

  // Polling WhatsApp connection and orders status
  const pollStatus = useCallback(async () => {
    if (!isAuthenticated || !adminKey) return;
    try {
      const res = await fetch(`/api/whatsapp-status?key=${encodeURIComponent(adminKey)}`);
      if (res.ok) {
        const data = await res.json();
        setWaStatus(data);
        if (!data.isConnected) {
          const qrRes = await fetch(`/api/whatsapp-qr?key=${encodeURIComponent(adminKey)}`);
          if (qrRes.ok) {
            const qrData = await qrRes.json();
            setQrDataURL(qrData.qrDataURL || qrData.qr || null);
          } else {
            setQrDataURL(null);
          }
        } else {
          setQrDataURL(null);
        }
      }

      const ordersRes = await fetch(`/api/orders?key=${encodeURIComponent(adminKey)}`);
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setUnreadCount(ordersData.unreadCount || 0);
      }
    } catch (e) {
      console.error("Error polling admin status:", e);
    }
  }, [isAuthenticated, adminKey]);

  useEffect(() => {
    if (isAuthenticated) {
      pollStatus();
      const interval = setInterval(pollStatus, 6000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, pollStatus]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;
    setIsVerifying(true);
    setAuthError(null);
    await verifyKey(keyInput.trim());
    setIsVerifying(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminKey(null);
    localStorage.removeItem('diego_admin_key');
  };

  const handleResetWhatsApp = async () => {
    if (!adminKey) return;
    setIsResetting(true);
    try {
      const res = await fetch(`/api/whatsapp-reset?key=${encodeURIComponent(adminKey)}`, {
        method: 'POST',
      });
      if (res.ok) {
        setQrDataURL(null);
        setTimeout(pollStatus, 1500);
      }
    } catch (err) {
      console.error('Reset error:', err);
    } finally {
      setIsResetting(false);
    }
  };

  // --- 1. LOGIN GATE FOR THE ADMIN PAGE ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-900 text-neutral-100 flex flex-col justify-center items-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm bg-neutral-800/90 border border-neutral-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
        >
          {/* Brand header */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-12 h-12 bg-gradient-to-br from-diego-light-orange to-diego-orange rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg -rotate-3">
              d
            </div>
            <div className="flex items-baseline gap-1.5 justify-center">
              <span className="font-black text-xl tracking-tight text-white">diego</span>
              <span className="font-black text-sm text-diego-orange">SAS</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-[11px] font-extrabold tracking-wider uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Portail Réception & Administration</span>
            </div>
            <p className="text-xs text-neutral-400 max-w-xs pt-1">
              Entrez la clé d'autorisation pour gérer les commandes et connecter le compte WhatsApp.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-neutral-300 uppercase tracking-wider">
                Clé d'autorisation
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="ex: diegosas"
                  autoFocus
                  required
                  className="w-full pl-3.5 pr-10 py-3 bg-neutral-900/90 border border-neutral-700 focus:border-diego-orange rounded-xl text-sm text-white placeholder-neutral-500 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifying}
              id="admin-login-btn"
              className="w-full py-3 px-4 bg-gradient-to-r from-diego-orange to-orange-500 hover:opacity-95 active:scale-[0.98] disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-orange-500/20"
            >
              {isVerifying ? 'Vérification...' : 'Se Connecter à la Réception'}
            </button>
          </form>

          {/* Link to public Client Site */}
          <div className="pt-2 border-t border-neutral-700/60 flex items-center justify-center">
            <button
              onClick={onNavigateToClient}
              className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors py-1 px-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retour au site client</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- 2. AUTHENTICATED RECEPTIONIST & ADMIN DASHBOARD ---
  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 flex flex-col font-sans">
      {/* Dedicated Admin Header */}
      <header className="sticky top-0 z-40 bg-neutral-900 text-white border-b border-neutral-800 shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Portal Identity */}
          <div className="flex items-center gap-3 select-none">
            <div className="w-8 h-8 bg-gradient-to-br from-diego-light-orange to-diego-orange rounded-xl flex items-center justify-center text-white font-black text-base shadow-sm -rotate-2">
              d
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-black text-base tracking-tight text-white">diego</span>
                <span className="font-black text-xs text-diego-orange">SAS</span>
                <span className="text-neutral-500 text-xs">|</span>
                <span className="text-xs font-bold text-neutral-300">Espace Réception</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 bg-neutral-800 p-1 rounded-xl border border-neutral-700">
            <button
              onClick={() => setActiveTab('orders')}
              id="admin-tab-orders"
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${activeTab === 'orders'
                ? 'bg-diego-blue text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
                }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Commandes</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-diego-orange text-white text-[9px] font-black animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('whatsapp')}
              id="admin-tab-whatsapp"
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${activeTab === 'whatsapp'
                ? 'bg-neutral-900 text-white shadow-sm border border-neutral-600'
                : 'text-neutral-400 hover:text-white'
                }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Connexion WhatsApp</span>
              <span
                className={`w-2 h-2 rounded-full ${waStatus?.isConnected
                  ? 'bg-emerald-400 ring-2 ring-emerald-400/30'
                  : waStatus?.isConflictState
                    ? 'bg-amber-400 ring-2 ring-amber-400/30 animate-pulse'
                    : 'bg-red-400'
                  }`}
              />
            </button>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToClient}
              title="Ouvrir le formulaire de réservation client"
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl text-xs font-bold text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Site Client</span>
            </button>

            <button
              onClick={handleLogout}
              title="Verrouiller la session réception"
              className="p-1.5 sm:px-3 sm:py-1.5 bg-red-950/60 hover:bg-red-900/80 border border-red-800/80 rounded-xl text-xs font-bold text-red-300 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'orders' ? (
            <motion.div
              key="tab-orders"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <OrdersInbox adminKey={adminKey} onLogout={handleLogout} />
            </motion.div>
          ) : (
            <motion.div
              key="tab-whatsapp"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <WhatsAppConnect
                adminKey={adminKey}
                waStatus={waStatus}
                qrDataURL={qrDataURL}
                isResetting={isResetting}
                onResetWhatsApp={handleResetWhatsApp}
                onRefreshStatus={pollStatus}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

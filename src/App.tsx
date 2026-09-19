import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  Beer,
  Truck,
  Sparkles,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { LeadFormData } from './types';
import { Header } from './components/Header';
import { LeadForm } from './components/LeadForm';
import { SuccessCard } from './components/SuccessCard';
import { AdminPage } from './components/AdminPage';

const INITIAL_FORM_DATA: LeadFormData = {
  nomClient: '',
  phone: '',
  natureEvenement: '',
  dateEvenement: '',
  lieuEvenement: '',
  nombreFuts: 1,
  marquesSouhaitees: '',
  heurePrestation: '',
};

function getIsAdminRoute(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const search = new URLSearchParams(window.location.search);
  return (
    path.startsWith('/admin') ||
    path.startsWith('/reception') ||
    search.get('page') === 'admin' ||
    search.get('page') === 'reception' ||
    search.get('view') === 'admin' ||
    search.get('view') === 'reception' ||
    search.has('admin')
  );
}

export default function App() {
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(getIsAdminRoute);

  // Client form state
  const [formData, setFormData] = useState<LeadFormData>(INITIAL_FORM_DATA);
  const [submittedLead, setSubmittedLead] = useState<LeadFormData | null>(null);
  const [submittedOrderId, setSubmittedOrderId] = useState<string | null>(null);
  const [directWhatsAppUrl, setDirectWhatsAppUrl] = useState<string | null>(null);
  const [receptionistPhone, setReceptionistPhone] = useState<string>('237695591420');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Listen to browser navigation changes (Back/Forward or pushState)
  useEffect(() => {
    const handlePopState = () => {
      setIsAdminRoute(getIsAdminRoute());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToClient = () => {
    window.history.pushState({}, '', '/');
    setIsAdminRoute(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'nombreFuts' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSelectEvent = (event: string) => {
    setFormData((prev) => ({ ...prev, natureEvenement: event }));
  };

  const handleToggleBrand = (brand: string) => {
    setFormData((prev) => {
      const raw = prev.marquesSouhaitees.trim();
      const list = raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : [];
      const index = list.findIndex((b) => b.toLowerCase() === brand.toLowerCase());

      let nextList: string[];
      if (index >= 0) {
        nextList = list.filter((_, i) => i !== index);
      } else {
        nextList = [...list, brand];
      }

      return {
        ...prev,
        marquesSouhaitees: nextList.join(', '),
      };
    });
  };

  const handleSetKegs = (count: number) => {
    setFormData((prev) => ({
      ...prev,
      nombreFuts: Math.max(1, count),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.nombreFuts < 1) {
      alert("NB : Veuillez sélectionner au moins 1 fût pour votre commande.");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage(null);

    try {
      const response = await fetch('/api/submit-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSubmittedLead({ ...formData });
        setSubmittedOrderId(result.order?.id || null);
        if (result.directWhatsAppUrl) {
          setDirectWhatsAppUrl(result.directWhatsAppUrl);
        }
        if (result.receptionistNumber) {
          setReceptionistPhone(result.receptionistNumber);
        }
        setSubmitStatus('success');
        setFormData(INITIAL_FORM_DATA);
      } else {
        setSubmitStatus('error');
        setErrorMessage(result.error || "Une erreur est survenue lors de l'envoi.");
      }
    } catch (error: any) {
      console.error("Submission error:", error);
      setSubmitStatus('error');
      setErrorMessage("Impossible de contacter le serveur. Vérifiez votre connexion Internet.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubmitStatus('idle');
    setSubmittedLead(null);
    setSubmittedOrderId(null);
    setDirectWhatsAppUrl(null);
  };

  // --- SEPARATE PAGE 1: DEDICATED ADMIN & RECEPTIONIST PORTAL ---
  if (isAdminRoute) {
    return <AdminPage onNavigateToClient={navigateToClient} />;
  }

  // --- SEPARATE PAGE 2: PURE CUSTOMER-FACING BEER ORDERING PAGE ---
  return (
    <div className="min-h-screen relative bg-slate-950 text-slate-100 font-sans pb-20 flex flex-col overflow-x-hidden selection:bg-orange-500 selection:text-white">
      {/* Background ambient lighting and fine grid mesh */}
      <div className="fixed inset-0 bg-ambient-pattern pointer-events-none" />
      <div className="fixed inset-0 bg-grid-mesh pointer-events-none opacity-40" />

      {/* Subtle top atmospheric glow */}
      <div className="fixed -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[320px] bg-gradient-to-b from-orange-500/20 via-blue-500/10 to-transparent blur-3xl pointer-events-none" />

      {/* Pristine customer-only Header */}
      <Header />

      <main className="relative z-10 w-full max-w-xl mx-auto px-4 sm:px-6 pt-6 flex-1">
        {/* Mobile Hero & Value Proposition */}
        <section className="mb-6 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-orange-500/15 via-amber-500/15 to-orange-500/10 border border-orange-500/30 text-diego-light-orange text-xs font-bold uppercase tracking-wider mb-3 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-diego-orange animate-pulse" />
            <span>Service Événementiel & Festif Clé en Main</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Votre <span className="text-transparent bg-clip-text bg-gradient-to-r from-diego-light-orange via-diego-orange to-orange-500">Bière a Pression</span> fraîchement servie
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed max-w-lg">
            Tireuse réfrigérée professionnelle, fûts d'usine Brasseries du Cameroun et gobelets premium livrés directement sur le lieu de votre événement à Yaoundé.
          </p>

          {/* Quick value badges */}
          <div className="grid grid-cols-3 gap-2.5 mt-4">
            <div className="glass-panel-dark p-3 rounded-2xl flex flex-col items-center text-center transition-transform hover:-translate-y-0.5">
              <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center mb-1.5">
                <Beer className="w-4 h-4 text-diego-light-orange" />
              </div>
              <span className="text-[11px] font-black text-white leading-tight">Dès 1 Fût</span>
              <span className="text-[10px] text-slate-400 leading-none mt-1">Au choix (20L / 30L)</span>
            </div>

            <div className="glass-panel-dark p-3 rounded-2xl flex flex-col items-center text-center transition-transform hover:-translate-y-0.5 ring-1 ring-emerald-500/30">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-1.5">
                <Truck className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-[11px] font-black text-emerald-300 leading-tight">Livraison Gratuite</span>
              <span className="text-[10px] text-slate-400 leading-none mt-1">Dès 3 fûts à Yaoundé</span>
            </div>

            <div className="glass-panel-dark p-3 rounded-2xl flex flex-col items-center text-center transition-transform hover:-translate-y-0.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center mb-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-[11px] font-black text-white leading-tight">Tireuse Incluse</span>
              <span className="text-[10px] text-slate-400 leading-none mt-1">Installation & Service</span>
            </div>
          </div>
        </section>

        {/* Error notification banner if any */}
        {submitStatus === 'error' && errorMessage && (
          <div className="mb-5 p-4 bg-red-950/80 border border-red-800/80 rounded-2xl flex items-start gap-3 text-xs text-red-200 shadow-lg">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <strong className="font-bold text-red-300">Erreur d'envoi :</strong> {errorMessage}
            </div>
          </div>
        )}

        {/* Lead Form or Success View */}
        <AnimatePresence mode="wait">
          {submitStatus === 'success' ? (
            <SuccessCard
              key="success"
              leadSummary={submittedLead}
              orderId={submittedOrderId}
              directWhatsAppUrl={directWhatsAppUrl}
              receptionistPhone={receptionistPhone}
              onReset={handleResetForm}
            />
          ) : (
            <LeadForm
              key="form"
              formData={formData}
              isSubmitting={isSubmitting}
              onInputChange={handleInputChange}
              onSelectEvent={handleSelectEvent}
              onToggleBrand={handleToggleBrand}
              onSetKegs={handleSetKegs}
              onSubmit={handleSubmit}
            />
          )}
        </AnimatePresence>

        {/* Pure Customer Footer */}
        <footer className="mt-12 text-center text-slate-400 text-[11px] font-semibold space-y-1.5 select-none pb-4">
          <div className="flex items-center justify-center gap-2 text-slate-500">
            <span className="w-8 h-px bg-slate-800" />
            <span className="uppercase tracking-widest text-[9px] font-black text-slate-400">Diego SAS Cameroun</span>
            <span className="w-8 h-px bg-slate-800" />
          </div>
          <p>© 2026 Diego SAS • Yaoundé, Cameroun • Tous droits réservés</p>
          <p className="text-diego-light-orange font-bold text-xs">Partenaire Agréé des Brasseries du Cameroun</p>
        </footer>
      </main>
    </div>
  );
}

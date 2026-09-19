import React from 'react';
import {
  User,
  Phone,
  Calendar,
  Clock,
  MapPin,
  Beer,
  Sparkles,
  ChevronRight,
  AlertCircle,
  Plus,
  Minus,
  Truck,
  MessageCircle
} from 'lucide-react';
import { LeadFormData } from '../types';
import { EVENT_TYPES, POPULAR_BEER_BRANDS, PRESET_KEGS } from '../data/constants';

interface LeadFormProps {
  formData: LeadFormData;
  isSubmitting: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectEvent: (event: string) => void;
  onToggleBrand: (brand: string) => void;
  onSetKegs: (count: number) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const LeadForm: React.FC<LeadFormProps> = ({
  formData,
  isSubmitting,
  onInputChange,
  onSelectEvent,
  onToggleBrand,
  onSetKegs,
  onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* 1. Client Contact Section */}
      <div className="glass-panel-dark rounded-3xl p-5 sm:p-7 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800/80">
          <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-black text-xs shadow-xs">
            1
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              Vos Coordonnées
            </h3>
            <p className="text-[11px] text-slate-400">Pour vous joindre et valider le devis</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Nom Client */}
          <div>
            <label htmlFor="nomClient" className="block text-[11px] font-bold text-slate-300 mb-1.5">
              Nom complet <span className="text-diego-orange">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                id="nomClient"
                required
                type="text"
                name="nomClient"
                value={formData.nomClient}
                onChange={onInputChange}
                placeholder="Ex : Franck Nguema"
                className="w-full min-h-[48px] pl-10 pr-3.5 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder:text-slate-500 text-sm focus:border-diego-orange focus:ring-2 focus:ring-diego-orange/20 transition-all outline-none"
              />
            </div>
          </div>

          {/* Téléphone */}
          <div>
            <label htmlFor="phone" className="block text-[11px] font-bold text-slate-300 mb-1.5">
              Numéro de téléphone WhatsApp <span className="text-diego-orange">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                id="phone"
                required
                type="tel"
                inputMode="tel"
                name="phone"
                value={formData.phone}
                onChange={onInputChange}
                placeholder="Ex : 699 00 00 00"
                className="w-full min-h-[48px] pl-10 pr-3.5 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder:text-slate-500 text-sm focus:border-diego-orange focus:ring-2 focus:ring-diego-orange/20 transition-all outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Event Details Section */}
      <div className="glass-panel-dark rounded-3xl p-5 sm:p-7 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800/80">
          <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 text-diego-light-orange flex items-center justify-center font-black text-xs shadow-xs">
            2
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              L'Événement & Lieu
            </h3>
            <p className="text-[11px] text-slate-400">Où et quand aura lieu la fête</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Nature de l'événement with mobile quick-tap chips */}
          <div>
            <label htmlFor="natureEvenement" className="block text-[11px] font-bold text-slate-300 mb-2">
              Nature de l'événement <span className="text-diego-orange">*</span>
            </label>

            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {EVENT_TYPES.map((ev) => {
                const isSelected = formData.natureEvenement === ev;
                return (
                  <button
                    key={ev}
                    type="button"
                    onClick={() => onSelectEvent(ev)}
                    className={`min-h-[34px] px-3.5 py-1 rounded-full text-xs font-semibold transition-all border ${isSelected
                      ? 'bg-diego-orange text-white border-diego-orange shadow-md shadow-orange-500/20'
                      : 'bg-slate-900/80 text-slate-300 border-slate-700/80 hover:bg-slate-800 hover:text-white'
                      }`}
                  >
                    {ev}
                  </button>
                );
              })}
            </div>

            <input
              id="natureEvenement"
              required
              type="text"
              name="natureEvenement"
              value={formData.natureEvenement}
              onChange={onInputChange}
              placeholder="Ou précisez un autre type d'événement..."
              className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder:text-slate-500 text-sm focus:border-diego-orange focus:ring-2 focus:ring-diego-orange/20 transition-all outline-none"
            />
          </div>

          {/* Lieu */}
          <div>
            <label htmlFor="lieuEvenement" className="block text-[11px] font-bold text-slate-300 mb-1.5">
              Lieu / Quartier <span className="text-diego-orange">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                id="lieuEvenement"
                required
                type="text"
                name="lieuEvenement"
                value={formData.lieuEvenement}
                onChange={onInputChange}
                placeholder="Ex : Bastos, face ambassade de Belgique"
                className="w-full min-h-[48px] pl-10 pr-3.5 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder:text-slate-500 text-sm focus:border-diego-orange focus:ring-2 focus:ring-diego-orange/20 transition-all outline-none"
              />
            </div>
          </div>

          {/* Date & Heure responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label htmlFor="dateEvenement" className="block text-[11px] font-bold text-slate-300 mb-1.5">
                Date de l'événement <span className="text-diego-orange">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="dateEvenement"
                  required
                  type="date"
                  name="dateEvenement"
                  value={formData.dateEvenement}
                  onChange={onInputChange}
                  className="w-full min-h-[48px] pl-10 pr-3 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-sm focus:border-diego-orange focus:ring-2 focus:ring-diego-orange/20 transition-all outline-none scheme-dark"
                />
              </div>
            </div>

            <div>
              <label htmlFor="heurePrestation" className="block text-[11px] font-bold text-slate-300 mb-1.5">
                Heure souhaitée <span className="text-diego-orange">*</span>
              </label>
              <div className="relative">
                <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="heurePrestation"
                  required
                  type="time"
                  name="heurePrestation"
                  value={formData.heurePrestation}
                  onChange={onInputChange}
                  className="w-full min-h-[48px] pl-10 pr-3 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-sm focus:border-diego-orange focus:ring-2 focus:ring-diego-orange/20 transition-all outline-none scheme-dark"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Beer Quantity & Brands Section */}
      <div className="glass-panel-dark rounded-3xl p-5 sm:p-7 space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800/80">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black text-xs shadow-xs">
            3
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              Sélection Bière a Pression
            </h3>
            <p className="text-[11px] text-slate-400">Volume total & marques par fût</p>
          </div>
        </div>

        {/* Tactile Stepper for Kegs */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-300">
              Nombre de fûts total <span className="text-diego-orange">*</span>
            </span>
            <span className="text-xs font-black text-diego-light-orange bg-orange-500/15 px-3 py-1 rounded-full border border-orange-500/30">
              {formData.nombreFuts} fût{formData.nombreFuts > 1 ? 's' : ''} au total
            </span>
          </div>

          {/* Stepper control bar */}
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-2 flex items-center justify-between gap-3 shadow-inner">
            <button
              type="button"
              id="decrease-kegs-btn"
              aria-label="Diminuer le nombre de fûts"
              disabled={formData.nombreFuts <= 1}
              onClick={() => onSetKegs(Math.max(1, (formData.nombreFuts || 1) - 1))}
              className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-white active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Minus className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center select-none">
              <span className="text-3xl font-black text-white tracking-tight">
                {formData.nombreFuts}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Fûts de bière
              </span>
            </div>

            <button
              type="button"
              id="increase-kegs-btn"
              aria-label="Augmenter le nombre de fûts"
              onClick={() => onSetKegs((formData.nombreFuts || 1) + 1)}
              className="w-12 h-12 rounded-xl bg-gradient-to-r from-diego-orange to-orange-500 text-white shadow-md shadow-orange-500/25 flex items-center justify-center active:scale-95 hover:opacity-95 transition-all"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center justify-between gap-2 mt-2.5">
            {PRESET_KEGS.map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => onSetKegs(num)}
                className={`flex-1 min-h-[34px] py-1 rounded-xl text-xs font-bold transition-all border ${formData.nombreFuts === num
                  ? 'bg-gradient-to-r from-diego-orange to-orange-500 text-white border-diego-orange shadow-md shadow-orange-500/20'
                  : 'bg-slate-900/70 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Beer Brand & Quantity Selection */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-[11px] font-bold text-slate-200">
                Choix des Marques & Quantité par Bière <span className="text-diego-orange">*</span>
              </label>
              <p className="text-[11px] text-slate-400">
                Ajustez les fûts désirés pour chaque marque :
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {POPULAR_BEER_BRANDS.map((brand) => {
              const regex = new RegExp(`${brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(?:\\((\\d+)\\))?`, 'i');
              const match = formData.marquesSouhaitees.match(regex);
              const isSelected = !!match;
              const count = match ? parseInt(match[1] || '1', 10) : 0;

              const updateBrandCount = (newCount: number) => {
                const brandMap: Record<string, number> = {};
                POPULAR_BEER_BRANDS.forEach((b) => {
                  const bRegex = new RegExp(`${b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(?:\\((\\d+)\\))?`, 'i');
                  const bMatch = formData.marquesSouhaitees.match(bRegex);
                  if (bMatch) {
                    brandMap[b] = parseInt(bMatch[1] || '1', 10);
                  }
                });

                if (newCount <= 0) {
                  delete brandMap[brand];
                } else {
                  brandMap[brand] = newCount;
                }

                const brandsArr = Object.entries(brandMap);
                let newTotal = brandsArr.reduce((acc, [, qty]) => acc + qty, 0);
                if (newTotal === 0) {
                  newTotal = 1;
                }

                const newMarquesStr = brandsArr
                  .map(([bName, qty]) => `${bName} (${qty})`)
                  .join(', ');

                onSetKegs(newTotal);
                const syntheticEvent = {
                  target: {
                    name: 'marquesSouhaitees',
                    value: newMarquesStr,
                  }
                } as unknown as React.ChangeEvent<HTMLInputElement>;
                onInputChange(syntheticEvent);
              };

              return (
                <div
                  key={brand}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${isSelected
                    ? 'bg-orange-500/10 border-orange-500/40 shadow-xs ring-1 ring-orange-500/20'
                    : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60'
                    }`}
                >
                  <button
                    type="button"
                    onClick={() => updateBrandCount(isSelected ? 0 : 1)}
                    className="flex-1 text-left flex items-center gap-2.5 select-none"
                  >
                    <div
                      className={`w-5 h-5 rounded-lg flex items-center justify-center border text-[10px] font-black transition-colors ${isSelected
                        ? 'bg-diego-orange text-white border-diego-orange'
                        : 'bg-slate-800 border-slate-700 text-transparent'
                        }`}
                    >
                      ✓
                    </div>
                    <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                      {brand}
                    </span>
                  </button>

                  {/* Quantity Stepper for this specific brand */}
                  {isSelected ? (
                    <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-xl border border-slate-700 shadow-inner">
                      <button
                        type="button"
                        onClick={() => updateBrandCount(count - 1)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 active:bg-slate-700"
                        title="Diminuer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-black text-diego-light-orange">
                        {count}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateBrandCount(count + 1)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 active:bg-slate-700"
                        title="Augmenter"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => updateBrandCount(1)}
                      className="text-[11px] font-bold text-slate-400 hover:text-diego-light-orange px-2.5 py-1 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      + Ajouter
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-3">
            <label htmlFor="marquesSouhaitees" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Récapitulatif de votre sélection & souhaits particuliers
            </label>
            <textarea
              required
              id="marquesSouhaitees"
              name="marquesSouhaitees"
              value={formData.marquesSouhaitees}
              onChange={onInputChange}
              rows={2}
              placeholder="Ex : 33 Export (2), Mutzig (1)..."
              className="w-full p-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder:text-slate-500 text-xs focus:border-diego-orange focus:ring-2 focus:ring-diego-orange/20 transition-all outline-none resize-none"
            />
          </div>
        </div>

        {/* Free transport notice */}
        <div className={`p-4 rounded-2xl border flex items-center gap-3 text-xs transition-all ${formData.nombreFuts >= 3
          ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
          : 'bg-amber-950/50 border-amber-500/30 text-amber-200'
          }`}>
          <Truck className={`w-5 h-5 shrink-0 ${formData.nombreFuts >= 3 ? 'text-emerald-400' : 'text-amber-400'}`} />
          <span className="leading-snug">
            {formData.nombreFuts >= 3 ? (
              <>
                <strong className="text-emerald-300 font-black">🎉 Livraison & Installation Pro 100% OFFERTES !</strong> Votre commande ({formData.nombreFuts} fûts) bénéficie de la gratuité totale partout à Yaoundé.
              </>
            ) : (
              <>
                <strong className="text-white">Livraison & Installation Pro :</strong> <span className="font-black text-diego-light-orange">GRATUITES dès 3 fûts</span> à Yaoundé. <em>(Pour 1 ou 2 fûts, de légers frais de logistique s'appliquent).</em>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-2 space-y-2.5">
        <button
          type="submit"
          id="submit-lead-btn"
          disabled={isSubmitting}
          className="w-full min-h-[56px] bg-gradient-to-r from-diego-orange via-orange-500 to-diego-light-orange active:brightness-95 hover:brightness-105 disabled:opacity-50 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2.5 transition-all active:scale-[0.99] cursor-pointer"
        >
          {isSubmitting ? (
            <span>Envoi de votre réservation en cours...</span>
          ) : (
            <>
              <span>Valider ma Réservation Bière Pression</span>
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
        <p className="text-center text-[11px] text-slate-400 font-medium">
          🔒 Données transmises instantanément à la réception Diego SAS • Validation immédiate
        </p>
      </div>
    </form>
  );
};

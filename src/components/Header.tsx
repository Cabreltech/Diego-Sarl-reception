import React from 'react';
import { MapPin, Sparkles, Award } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/70 dark:border-slate-800/80 transition-all duration-300 shadow-xs">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-3 select-none">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-diego-light-orange via-diego-orange to-orange-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md shadow-orange-500/25 ring-2 ring-white/20 transform -rotate-1">
              d
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">diego</span>
              <span className="font-black text-xs px-1.5 py-0.5 rounded-md bg-diego-orange text-white tracking-wider">SAS</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wide flex items-center gap-1">
              <span>Service Bière Pression Pro</span>
              <span className="text-slate-300">•</span>
              <span className="text-diego-blue font-bold">Brasseries du Cameroun</span>
            </p>
          </div>
        </div>

        {/* Location Badge */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 bg-slate-100/90 dark:bg-slate-800/90 px-3 py-1.5 rounded-full border border-slate-200/80 dark:border-slate-700/80 select-none flex items-center gap-1.5 shadow-2xs">
            <MapPin className="w-3.5 h-3.5 text-diego-orange" />
            <span className="hidden sm:inline">Yaoundé, Cameroun</span>
            <span className="sm:hidden">Yaoundé</span>
          </span>
        </div>
      </div>
    </header>
  );
};


import React from 'react';
import { ChevronRight, MapPin, TrendingUp, Sparkles } from 'lucide-react';

const RegionCard = ({ region, rank, isTop, isBottom, onClick, value, label }) => {
  const formatMoney = (val) => {
    if (!val) return 'Rp 0';
    if (val >= 1000000000000) return `Rp ${(val / 1000000000000).toFixed(2)} Triliun`;
    if (val >= 1000000000) return `Rp ${(val / 1000000000).toFixed(1)} Miliar`;
    return `Rp ${(val / 1000000).toFixed(1)} Juta`;
  };

  const getRankStyles = () => {
    if (isTop) {
      if (rank === 1) return 'bg-amber-500/20 text-amber-400 ring-amber-500/30';
      if (rank === 2) return 'bg-slate-400/20 text-slate-300 ring-slate-400/30';
      if (rank === 3) return 'bg-orange-500/20 text-orange-400 ring-orange-500/30';
      return 'bg-emerald-500/20 text-emerald-400 ring-emerald-500/30';
    }
    if (isBottom) return 'bg-rose-500/20 text-rose-400 ring-rose-500/30';
    return 'bg-white/5 text-slate-500 ring-white/10';
  };

  const getTipeColor = (tipe) => {
    switch(tipe) {
      case 'Provinsi': return 'bg-brand-500';
      case 'Kota': return 'bg-blue-600';
      case 'Kabupaten': return 'bg-emerald-600';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div 
      onClick={onClick}
      className={`group relative bg-white/5 cursor-pointer rounded-2xl md:rounded-3xl p-4 md:p-6 border transition-all duration-300 hover:shadow-2xl hover:translate-y-[-4px] backdrop-blur-xl ${
        isTop ? 'border-emerald-500/20 shadow-emerald-500/5' : 
        isBottom ? 'border-rose-500/20 shadow-rose-500/5' : 'border-white/10 shadow-sm'
      }`}
    >
      {isTop && rank === 1 && (
        <div className="absolute -top-3 -left-2 md:-left-3 bg-amber-500 text-white p-1.5 md:p-2 rounded-lg md:rounded-xl shadow-lg animate-bounce z-10">
          <Sparkles size={14} className="md:w-4 md:h-4" />
        </div>
      )}

      <div className="flex items-center gap-4 md:gap-6">
        {/* Rank Badge */}
        <div className={`flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl ring-2 flex flex-col items-center justify-center font-black shadow-lg ${getRankStyles()}`}>
          <span className="text-[8px] md:text-[10px] uppercase opacity-60">Rank</span>
          <span className="text-sm md:text-xl">#{rank}</span>
        </div>

        {/* Info */}
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
             <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full flex-shrink-0 ${getTipeColor(region.tipe)}`} />
            <h3 className="font-header font-black text-white truncate text-sm md:text-lg group-hover:text-brand-400 transition-colors uppercase tracking-tight">{region.daerah}</h3>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6">
            <div className={`flex items-center gap-1 md:gap-2 font-black text-sm md:text-base ${isBottom ? 'text-rose-400' : 'text-emerald-400'}`}>
              <TrendingUp size={14} className="md:w-4 md:h-4" />
              {formatMoney(value || region.rataRataPAD)}
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 text-[10px] md:text-xs font-bold">
               {label ? (
                 <span className="truncate">{label}</span>
               ) : (
                 <>
                   <MapPin size={12} className="text-slate-300 md:w-3.5 md:h-3.5" />
                   {region.tahunList?.length || 0} Tahun
                 </>
               )}
            </div>
          </div>
        </div>

        {/* Action */}
        <button className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:bg-brand-500 group-hover:text-white group-hover:rotate-[-45deg] transition-all duration-500 shadow-inner">
          <ChevronRight size={20} className="md:w-6 md:h-6" />
        </button>
      </div>
    </div>
  );
};

export default RegionCard;

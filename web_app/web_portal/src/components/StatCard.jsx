import React from 'react';

const StatCard = ({ title, value, icon: Icon, description, trend, color = 'brand' }) => {
  const getColors = () => {
    switch(color) {
      case 'brand': return 'bg-brand-500/10 text-brand-400 border border-brand-500/20';
      case 'emerald': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'blue': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'rose': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'amber': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      default: return 'bg-white/5 text-slate-400 border border-white/10';
    }
  };

  return (
    <div className="bg-white rounded-[24px] md:rounded-[28px] p-5 md:p-7 border border-slate-200 hover:shadow-lg hover:translate-y-[-4px] transition-all duration-300 h-full flex flex-col justify-between shadow-sm">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${getColors()}`}>
          <Icon size={20} className="md:w-6 md:h-6" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-black ${trend > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
             {trend > 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
      <div>
        <h3 className="text-slate-500 text-[10px] md:text-xs font-black uppercase tracking-widest">{title}</h3>
        <p className="text-xl md:text-3xl font-black text-slate-900 mt-1 md:mt-2 tracking-tight">{value || '0'}</p>
        {description && (
          <p className="text-slate-500 text-[8px] md:text-[10px] font-bold mt-3 md:mt-4 uppercase tracking-wider">{description}</p>
        )}
      </div>
    </div>
  );
};

export default StatCard;

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Activity, FileText, ChevronRight, BarChart2 } from 'lucide-react';

const AiAnalysisPanel = ({ data }) => {
  if (!data) return null;

  return (
    <div className="space-y-6 mt-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/30">
          <Sparkles className="text-white w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">AI Analysis</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Powered by Google Gemini</p>
        </div>
      </div>

      <div className="space-y-4">
        {data.sections.map((section, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden"
          >
           
            {/* Section Header */}
            <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex items-center gap-3">
              <span className="text-xl">{section.icon}</span>
              <h4 className="text-[10px] font-black text-slate-700 uppercase leading-snug tracking-wide">{section.title}</h4>
            </div>

            <div className="p-5 text-sm text-slate-600 leading-relaxed bg-white/50">
              {section.type === 'summary' && (
                <div className="space-y-3">
                  {section.content.map((p, i) => (
                    <p key={i} className="text-xs text-slate-500 font-medium leading-relaxed">{p}</p>
                  ))}
                </div>
              )}

              {section.type === 'list' && (
                <div className="space-y-6">
                  {section.intro && <p className="text-xs text-slate-500 font-medium italic mb-2">{section.intro}</p>}
                  {section.items.map((item, i) => (
                    <div key={i} className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200/50">
                        <span className="text-lg">{item.icon}</span>
                        <h5 className="text-[10px] font-black text-slate-800 uppercase tracking-wide">{item.title}</h5>
                      </div>
                      <ul className="space-y-2.5 pl-1">
                        {item.details.map((detail, dIdx) => {
                          const isBold = detail.trim().startsWith('📌') || detail.trim().startsWith('💡') || detail.includes('**');
                          const cleanDetail = detail.replace(/\*\*/g, '');
                          
                          return (
                            <li key={dIdx} className={`text-[10px] leading-relaxed flex gap-2 ${isBold ? 'text-slate-700 font-bold' : 'text-slate-500'}`}>
                              {isBold ? <div className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 shrink-0" /> : <div className="w-1 h-1 rounded-full bg-slate-200 mt-1.5 shrink-0" />}
                              <span>{cleanDetail}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {section.type === 'conclusion' && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100/50">
                  {section.intro && <p className="text-[9px] font-black text-indigo-900 uppercase tracking-widest mb-4">{section.intro}</p>}
                  <ul className="space-y-3">
                    {section.points.map((point, pIdx) => {
                        const parts = point.split(':');
                        const hasColon = parts.length > 1;
                        const boldText = hasColon ? parts[0] : null;
                        const normalText = hasColon ? parts.slice(1).join(':') : point;

                        return (
                            <li key={pIdx} className="flex gap-2.5 items-start text-[10px] text-slate-600">
                                <div className="min-w-[6px] h-[6px] rounded-full bg-indigo-500 mt-1 shadow-sm shadow-indigo-500/30" />
                                <span className="leading-relaxed">
                                    {boldText && <span className="font-bold text-slate-800 uppercase text-[9px] tracking-wide block mb-0.5">{boldText.replace(/\*\*/g, '')}</span>}
                                    {normalText.replace(/\*\*/g, '')}
                                </span>
                            </li>
                        )
                    })}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AiAnalysisPanel;

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';

const CollapsibleSubSection = ({ title, badgeText, badgeColor, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-8 last:mb-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 mb-4 p-2 rounded-xl hover:bg-slate-50 transition-colors group"
      >
         <div className={`p-2 rounded-full ${isOpen ? 'bg-slate-100 rotate-90 text-slate-600' : 'bg-white text-slate-400'} transition-all duration-300 shadow-sm ring-1 ring-slate-100`}>
             <ChevronRight size={16} />
         </div>
         <div className="flex items-center gap-3 flex-1">
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${badgeColor}`}>{badgeText}</span>
            <div className={`h-px flex-grow transition-colors ${isOpen ? 'bg-slate-200' : 'bg-slate-100'}`} />
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                {isOpen ? 'Tutup' : 'Buka'}
            </span>
        </div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
            >
                <div className="pt-2 pb-6">
                    {children}
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CollapsibleSubSection;

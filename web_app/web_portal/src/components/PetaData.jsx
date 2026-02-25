import React from 'react';
import InteractiveMap from './InteractiveMap';
import { Map } from 'lucide-react';

const PetaData = ({ allData, selectedYear, activeMetric = 'rataRataPAD', subDataLookup = {}, onDetailClick }) => {
  return (
    <div className="h-full w-full">
      <div className="bg-white p-6 rounded-[32px] shadow-xl ring-1 ring-slate-100 flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-header text-2xl font-black text-slate-900 uppercase tracking-tight">Peta Distribusi Realisasi ({selectedYear})</h3>
            <p className="text-slate-500 text-sm mt-1">Visualisasi geospasial realisasi PAD Kab/Kota se-Jawa</p>
          </div>
          <div className="bg-brand-50 p-3 rounded-2xl">
             <Map className="text-brand-600" size={24} />
          </div>
        </div>
        
        <div className="flex-1 rounded-[24px] overflow-hidden border border-slate-200 bg-slate-50 relative">
           <InteractiveMap data={allData} selectedYear={selectedYear} activeMetric={activeMetric} subDataLookup={subDataLookup} onDetailClick={onDetailClick} />
        </div>
      </div>
    </div>
  );
};

export default PetaData;

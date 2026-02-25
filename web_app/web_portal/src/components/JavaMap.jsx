import React, { useState } from 'react';

const JavaMap = ({ data, onRegionClick }) => {
  const [hoveredRegion, setHoveredRegion] = useState(null);

  // Helper to normalize data values for coloring
  const getValue = (regionName) => {
    const region = data.find(d => d.name === regionName);
    return region ? region.value : 0;
  };

  const getLogarithmicColor = (val, max) => {
    if (!val) return '#f1f5f9'; // slate-100
    // Simple heatmap logic: Darker blue for higher values
    const intensity = Math.min(1, val / max);
    // Interpolate between light blue (#e0e7ff) and deep blue (#1e1b4b)
    // Simplified: using opacity/alpha on the main brand color
    if (intensity > 0.8) return '#1e1b4b'; // indigo-950
    if (intensity > 0.6) return '#312e81'; // indigo-900
    if (intensity > 0.4) return '#4338ca'; // indigo-700
    if (intensity > 0.2) return '#6366f1'; // indigo-500
    return '#a5b4fc'; // indigo-300
  };

  const maxVal = Math.max(...data.map(d => d.value), 1);

  const regions = [
    {
      id: 'Banten',
      name: 'Banten',
      path: "M45,95 C45,95 80,85 95,90 C95,90 100,130 95,145 C95,145 60,165 40,155 C40,155 20,130 45,95 Z",
      labelX: 60,
      labelY: 125
    },
    {
      id: 'DKI Jakarta',
      name: 'DKI Jakarta',
      path: "M100,85 L115,85 L115,95 L100,95 Z",
      labelX: 108,
      labelY: 80
    },
    {
      id: 'Jawa Barat',
      name: 'Jawa Barat',
      path: "M95,90 L115,95 L180,95 L220,110 L210,170 L160,185 L95,145 Z",
      labelX: 150,
      labelY: 135
    },
    {
      id: 'Jawa Tengah',
      name: 'Jawa Tengah',
      path: "M220,110 L300,105 L340,120 L330,170 L280,180 L250,165 L210,170 Z",
      labelX: 275,
      labelY: 140
    },
    {
      id: 'DIY Yogyakarta',
      name: 'DIY Yogyakarta',
      path: "M280,180 L320,175 L315,195 L285,190 Z",
      labelX: 300,
      labelY: 200
    },
    {
      id: 'Jawa Timur',
      name: 'Jawa Timur',
      path: "M340,120 L400,115 L460,130 L440,190 L380,200 L330,170 Z M400,90 L450,95 L445,110 L405,105 Z", // Main land + Madura
      labelX: 390,
      labelY: 150
    }
  ];

  return (
    <div className="w-full relative bg-blue-50/50 rounded-[24px] md:rounded-[32px] p-4 md:p-8 overflow-hidden">
      <div className="absolute top-4 left-6 z-10 hidden md:block">
         <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Peta Interaktif</h4>
         <p className="text-xs text-slate-400 mt-1">Hover untuk detail</p>
      </div>

      <svg viewBox="0 0 500 250" className="w-full h-auto drop-shadow-xl my-4 md:my-0">
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Ocean Background - implied by container, but maybe adds some waves later */}
        
        {regions.map((region) => {
          const val = getValue(region.name);
          const fillColor = getLogarithmicColor(val, maxVal);
          const isHovered = hoveredRegion === region.id;

          return (
            <g 
              key={region.id}
              onMouseEnter={() => setHoveredRegion(region.id)}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => onRegionClick && onRegionClick(region.name)}
              className="cursor-pointer transition-all duration-300"
              style={{ 
                transform: isHovered ? 'translateY(-2px)' : 'none', 
                filter: isHovered ? 'url(#glow)' : 'none',
                transformBox: 'fill-box',
                transformOrigin: 'center'
              }}
            >
              <path
                d={region.path}
                fill={fillColor}
                stroke="white"
                strokeWidth={1.5}
                className="transition-colors duration-300 ease-in-out"
              />
              
              {/* Region Label */}
              <text
                x={region.labelX}
                y={region.labelY}
                textAnchor="middle"
                className={`text-[8px] font-black pointer-events-none uppercase tracking-wider fill-white drop-shadow-md ${isHovered ? 'opacity-100' : 'opacity-80'}`}
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
              >
                {region.name === 'DKI Jakarta' ? 'DKI' : 
                 region.name === 'DIY Yogyakarta' ? 'DIY' : 
                 region.name.replace('Jawa ', '')}
              </text>

              {/* Tooltip on Hover */}
              {isHovered && (
                <text
                  x={250}
                  y={40}
                  textAnchor="middle"
                  className="text-xs font-bold fill-indigo-900"
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Floating Info Box for Hovered Region */}
      {hoveredRegion && (
        <div className="absolute bottom-4 right-4 md:top-6 md:right-6 bg-white/90 backdrop-blur-md p-3 md:p-4 rounded-xl shadow-lg border border-white/20 z-20 transition-all animate-in fade-in slide-in-from-bottom-2">
          <h5 className="font-black text-slate-800 text-sm md:text-lg mb-0.5 md:mb-1">{hoveredRegion}</h5>
          <div className="space-y-0.5 md:space-y-1">
             <p className="text-[8px] md:text-xs text-slate-500 uppercase font-bold">Total PAD</p>
             <p className="text-indigo-600 font-bold text-sm md:text-xl">
               Rp {(getValue(hoveredRegion) / 1000000000).toFixed(1)} M
             </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default JavaMap;

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, RefreshCw } from 'lucide-react';
import AiAnalysisPanel from './AiAnalysisPanel';
import { aiAnalysisData } from '../data/aiAnalysisData';

// Fix leaflet icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper for identical string cleaning across the component
const normalize = (val) => (val || '').toString().toUpperCase()
  .replace(/(KAB\.|KOTA|PROV\.|ADMINISTRASI|ADM\.|PROVINSI|KABUPATEN|DKI|DI|JAWA| )/g, '')
  .replace(/[^A-Z0-9]/g, '')
  .trim();

// Map UI Components - Memoized to prevent 'render' function errors
const MapContent = React.memo(({ geoData, getFeatureStyle, onEachFeature, findMatchingData, viewMode }) => {
  if (!geoData) return null;
  
  return (
    <>
      <GeoJSON 
        data={geoData} 
        style={getFeatureStyle}
        onEachFeature={onEachFeature}
      />
      
      {/* Titik-titik Wilayah (Markers) - Removed as requested */}
    </>
  );
});

// Internal Error Boundary - Simplified
class MapErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { console.error("Map Error caught:", error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-[600px] flex items-center justify-center bg-slate-50 text-slate-400 rounded-[32px] border border-slate-200">
          <div className="text-center p-8">
            <p className="font-bold mb-4">Terjadi kesalahan teknis pada modul peta.</p>
            <button onClick={() => window.location.reload()} className="px-6 py-2 bg-brand-500 text-white rounded-xl text-xs font-bold hover:bg-brand-600 transition-colors">Muat Ulang Halaman</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Custom Zoom Controls Component
const ZoomControls = () => {
  const map = useMap();
  return (
    <div className="absolute top-24 left-6 z-[1000] flex flex-col gap-1 bg-white/90 backdrop-blur-xl p-1.5 rounded-[22px] border border-white shadow-2xl">
      <button 
        onClick={() => map.zoomIn()}
        className="p-3 rounded-[16px] text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all active:scale-90"
        title="Zoom In"
      >
        <Plus size={18} strokeWidth={3} />
      </button>
      <div className="h-px bg-slate-100 mx-2" />
      <button 
        onClick={() => map.zoomOut()}
        className="p-3 rounded-[16px] text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all active:scale-90"
        title="Zoom Out"
      >
        <Minus size={18} strokeWidth={3} />
      </button>
      <div className="h-px bg-slate-100 mx-2" />
      <button 
        onClick={() => map.setView([-7.2, 110], 7.5)}
        className="p-3 rounded-[16px] text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all active:scale-90"
        title="Reset View"
      >
        <RefreshCw size={16} strokeWidth={3} />
      </button>
    </div>
  );
};

const InteractiveMap = ({ data, selectedYear = 2025, activeMetric = 'rataRataPAD', subDataLookup = {}, onDetailClick }) => {
  const [geoData, setGeoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFeature, setActiveFeature] = useState(null);
  const [mapError, setMapError] = useState(false);
  const [viewMode, setViewMode] = useState('realisasi');

  // Dynamic thresholds — calculated from actual data distribution (percentile-based)
  // Klaster: I (<p15), II (p15-p35), III (p35-p55), IV (p55-p75), V (p75-p90), VI (>p90)
  const dynamicThresholds = useMemo(() => {
    if (!data || data.length === 0) return { t1: 5e11, t2: 1e12, t3: 2e12, t4: 3e12, t5: 5e12 };
    
    const values = data
      .map(d => viewMode === 'realisasi' ? (d.rataRataPAD || 0) : (d.rataRataAnggaran || 0))
      .filter(v => v > 0)
      .sort((a, b) => a - b);

    if (values.length === 0) return { t1: 5e11, t2: 1e12, t3: 2e12, t4: 3e12, t5: 5e12 };

    const pct = (p) => {
      const idx = Math.floor((p / 100) * (values.length - 1));
      return values[idx];
    };

    return {
      t1: pct(15),  // Klaster II threshold
      t2: pct(35),  // Klaster III threshold
      t3: pct(55),  // Klaster IV threshold
      t4: pct(75),  // Klaster V threshold
      t5: pct(90),  // Klaster VI threshold
    };
  }, [data, viewMode]);

  // 1. Data Processing - Simplify and use pre-calculated fields from App.jsx
  const dataMap = useMemo(() => {
    if (!data || !Array.isArray(data)) return {};
    return data.reduce((acc, d) => {
      if (d?.daerah) {
        // Since we now pass activeYearData, d is already a year-specific or aggregated record
        const displayPAD = d.rataRataPAD || 0;
        const displayAnggaran = d.rataRataAnggaran || 0;
        
        acc[d.daerah] = {
          ...d,
          displayPAD,
          displayAnggaran,
          displayYearly: d.yearly || d.dataPerTahun?.reduce((acc, y) => {
            acc[y.tahun] = (y.pajakRealisasi || 0) + (y.retribusiRealisasi || 0) + (y.pengelolaanRealisasi || 0) + (y.lainPadRealisasi || 0);
            return acc;
          }, {}) || {},
          displayYearlyAnggaran: d.yearlyAnggaran || d.dataPerTahun?.reduce((acc, y) => {
            acc[y.tahun] = (y.pajakAnggaran || 0) + (y.retribusiAnggaran || 0) + (y.pengelolaanAnggaran || 0) + (y.lainPadAnggaran || 0);
            return acc;
          }, {}) || {}
        };
      }
      return acc;
    }, {});
  }, [data]);

  // 2. Fetch GeoJSON - Load & Consolidate Jakarta
  useEffect(() => {
    let isMounted = true;
    const loadGeo = async () => {
      try {
        const [resReg, resProv] = await Promise.all([
          fetch('/java_regencies.json'),
          fetch('/java_provinces.json')
        ]);

        if (!resReg.ok || !resProv.ok) throw new Error('Local GeoJSON missing');
        
        const [regJson, provJson] = await Promise.all([
          resReg.json(),
          resProv.json()
        ]);

        if (isMounted) {
          // Consolidate Jakarta: Remove parts from regencies, add one whole from provinces
          const nonJakartaRegencies = regJson.features.filter(f => {
            const p = f.properties;
            const code = (p.Code || p.code || p.id || '').toString();
            const name = (p.Name || p.name || '').toUpperCase();
            // Higher precision filter: anything under BPS code 31 (Jakarta)
            return !code.startsWith('31') && !name.includes('JAKARTA') && !name.includes('SERIBU');
          });

          const jakartaProvince = provJson.features.find(f => {
            const name = (f.properties.Propinsi || f.properties.NAME_1 || '').toUpperCase();
            return name.includes('JAKARTA');
          });

          if (jakartaProvince) {
            // Normalize Jakarta Province properties to match our findMatchingData expectation
            const mergedJakarta = {
              ...jakartaProvince,
              properties: {
                ...jakartaProvince.properties,
                Code: '3100', // Canonical Jakarta code
                Name: 'DKI JAKARTA',
                daerah: 'DKI Jakarta'
              }
            };
            
            setGeoData({
              type: 'FeatureCollection',
              features: [...nonJakartaRegencies, mergedJakarta]
            });
          } else {
            console.warn('Jakarta province polygon not found, falling back to regencies');
            setGeoData(regJson);
          }

          setLoading(false);
        }
      } catch (err) {
        console.error('Load Map Fail:', err);
        if (isMounted) {
          setLoading(false);
          setMapError(true);
        }
      }
    };
    loadGeo();
    return () => { isMounted = false; };
  }, []);

    // 3. Matching Logic - Robust for Kabupaten/Kota using BPS Codes
  const findMatchingData = useCallback((props) => {
    if (!props) return null;
    const name = (props.Name || props.name || props.NAME_2 || '').toString().toUpperCase();
    const code = (props.Code || props.code || '').toString();
    
    if (!name && !code) return null;

    // Special Case: DKI Jakarta (All 31xx codes map to 'DKI Jakarta')
    if (code.startsWith('31') || name.includes('JAKARTA') || name.includes('SERIBU')) {
      return dataMap['DKI Jakarta'];
    }

    // Determine if Kota or Kab based on Code (decades 7x are usually cities in BPS)
    const isKota = code.length >= 4 && code.substring(2, 3) >= '7';
    
    const cleanName = name.replace(/(KABUPATEN|KOTA|KAB\.|ADM\.|ADMINISTRASI| )/g, '').trim();
    const cand1 = `Kota ${cleanName}`;
    const cand2 = `Kab. ${cleanName}`;
    const cand3 = Object.keys(dataMap).find(k => normalize(k) === normalize(cleanName));

    if (dataMap[cand1]) return dataMap[cand1];
    if (dataMap[cand2]) return dataMap[cand2];
    if (cand3 && dataMap[cand3]) return dataMap[cand3];
    
    // Fallback fuzzy match
    const searchKey = normalize(name);
    return Object.values(dataMap).find(d => {
      const dNorm = normalize(d.daerah);
      const typeMatch = isKota ? d.tipe === 'Kota' : d.tipe === 'Kabupaten';
      return typeMatch && (dNorm === searchKey || dNorm.includes(searchKey) || searchKey.includes(dNorm));
    });
  }, [dataMap]);

  // 4. Styling & Hover — Dynamic percentile-based color thresholds
  const KLASTER_COLORS = [
    '#3b82f6',  // Klaster I  — biru   (terendah)
    '#f59e0b',  // Klaster II — amber
    '#10b981',  // Klaster III— hijau
    '#a855f7',  // Klaster IV — ungu
    '#ef4444',  // Klaster V  — merah
    '#0f766e',  // Klaster VI — teal   (tertinggi)
  ];

  const getFeatureStyle = useCallback((feature) => {
    const matched = findMatchingData(feature.properties);
    const value = matched
      ? (viewMode === 'realisasi' ? (Number(matched.displayPAD) || 0) : (Number(matched.displayAnggaran) || 0))
      : 0;

    const { t1, t2, t3, t4, t5 } = dynamicThresholds;
    
    let color = KLASTER_COLORS[0]; // Default: Klaster I
    if      (value >= t5) color = KLASTER_COLORS[5]; // Klaster VI
    else if (value >= t4) color = KLASTER_COLORS[4]; // Klaster V
    else if (value >= t3) color = KLASTER_COLORS[3]; // Klaster IV
    else if (value >= t2) color = KLASTER_COLORS[2]; // Klaster III
    else if (value >= t1) color = KLASTER_COLORS[1]; // Klaster II

    return {
      fillColor: color,
      weight: 0.5,
      opacity: 1,
      color: '#cbd5e1',
      fillOpacity: matched ? 0.85 : 0.08
    };
  }, [findMatchingData, viewMode, dynamicThresholds]);

  const onEachFeature = useCallback((feature, layer) => {
    const matched = findMatchingData(feature.properties);
    // Consolidate name for display
    const rawName = (feature.properties.Name || feature.properties.name || 'Wilayah');
    const displayName = matched?.daerah === 'DKI Jakarta' ? 'DKI Jakarta' : rawName;

    const formatShort = (val) => {
      if (val >= 1e12) return `Rp ${(val/1e12).toFixed(2)} T`;
      return `Rp ${(val/1e9).toFixed(1)} M`;
    };

    layer.on({
      mouseover: (e) => {
        const target = e.target;
        target.setStyle({ weight: 2, color: '#f59e0b', fillOpacity: 0.9 });
        target.bringToFront();
      },
      mouseout: (e) => {
        const target = e.target;
        target.setStyle(getFeatureStyle(feature));
      },
      click: (e) => {
        if (e.originalEvent) L.DomEvent.stopPropagation(e.originalEvent);
        if (matched) setActiveFeature(matched);
        else setActiveFeature({ daerah: name, unknown: true });
      }
    });

    if (matched) {
      const val = viewMode === 'realisasi' ? matched.displayPAD : matched.displayAnggaran;
      layer.bindTooltip(`
        <div class="p-2">
          <p class="font-black text-[10px] uppercase text-slate-400 mb-1">${displayName}</p>
          <p class="text-xs font-black text-slate-900">${formatShort(val)}</p>
          <p class="text-[8px] font-bold text-slate-400 mt-1 uppercase">${viewMode.toUpperCase()}</p>
        </div>
      `, { sticky: true, className: '!bg-white/90 !backdrop-blur-md !border-none !shadow-2xl !rounded-xl' });
    } else {
      layer.bindTooltip(displayName, { sticky: true });
    }
  }, [findMatchingData, getFeatureStyle, viewMode]);

  // Views
  if (loading) return (
    <div className="h-[600px] flex flex-col items-center justify-center bg-slate-50 rounded-[32px] border border-slate-100">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Detailing Regencies...</p>
    </div>
  );

  return (
    <MapErrorBoundary>
      <div className="relative rounded-[40px] overflow-hidden border border-slate-200 bg-white h-[650px] shadow-2xl z-0">
        <MapContainer 
          key={geoData ? 'loaded' : 'empty'}
          center={[-7.2, 110]} 
          zoom={7.5} 
          style={{ height: '100%', width: '100%', background: '#f8fafc' }}
          zoomControl={false}
          scrollWheelZoom={true}
          touchZoom={true}
        >
          <TileLayer 
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; CARTO'
          />
          <MapContent 
            geoData={geoData}
            getFeatureStyle={getFeatureStyle}
            onEachFeature={onEachFeature}
            findMatchingData={findMatchingData}
            viewMode={viewMode}
          />
          <ZoomControls />

          {/* Mode Switcher */}
          <div className="absolute top-6 left-6 z-[1000] flex bg-white/90 backdrop-blur-xl p-1.5 rounded-[24px] border border-white shadow-2xl">
            {[
              { id: 'realisasi', label: 'Realisasi' },
              { id: 'anggaran', label: 'Anggaran' }
            ].map(mode => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className={`px-6 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${
                  viewMode === mode.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {/* Dynamic Legend — auto-updates based on actual data distribution */}
          {(() => {
            const fmt = (v) => v >= 1e12 ? `${(v/1e12).toFixed(1)}T` : `${(v/1e9).toFixed(0)}M`;
            const { t1, t2, t3, t4, t5 } = dynamicThresholds;
            const items = [
              { c: '#0f766e', l: `Klaster VI (≥ ${fmt(t5)})` },
              { c: '#ef4444', l: `Klaster V  (${fmt(t4)} – ${fmt(t5)})` },
              { c: '#a855f7', l: `Klaster IV (${fmt(t3)} – ${fmt(t4)})` },
              { c: '#10b981', l: `Klaster III (${fmt(t2)} – ${fmt(t3)})` },
              { c: '#f59e0b', l: `Klaster II  (${fmt(t1)} – ${fmt(t2)})` },
              { c: '#3b82f6', l: `Klaster I   (< ${fmt(t1)})` },
            ];
            return (
              <div className="absolute bottom-6 right-6 z-[1000] bg-white/95 backdrop-blur-md p-5 rounded-[24px] border border-slate-100 shadow-2xl pointer-events-none min-w-[200px]">
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Klaster Kemendagri</h4>
                <p className="text-[8px] font-bold text-brand-500 uppercase tracking-widest mb-3">Auto-scaled • {selectedYear === 'all' ? 'Semua Tahun' : selectedYear}</p>
                <div className="space-y-2.5">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-sm shadow-sm flex-shrink-0" style={{ background: item.c }} />
                      <span className="text-[9px] font-bold text-slate-600 tracking-wide font-mono">{item.l}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </MapContainer>

        {/* Info Panel */}
        <AnimatePresence>
          {activeFeature && (
            <motion.div
              initial={{ x: 380 }} animate={{ x: 0 }} exit={{ x: 380 }}
              className="absolute top-0 right-0 w-80 h-full z-[1001] bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.1)] flex flex-col"
            >
              <div className="p-10 border-b border-slate-50 flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-black text-brand-500 uppercase tracking-widest mb-1 block">Local Insight</span>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">{activeFeature.daerah}</h3>
                </div>
                <button onClick={() => setActiveFeature(null)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="p-10 flex-1 overflow-y-auto space-y-10 custom-scrollbar">
                {activeFeature.unknown ? (
                  <div className="p-8 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-100 text-center">
                    <p className="text-slate-400 text-xs font-bold leading-loose">Data rincian tidak tersedia untuk wilayah ini.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                       <div className="bg-slate-900 p-8 rounded-[32px] text-white shadow-2xl">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Realisasi PAD ({selectedYear})</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xs font-bold text-slate-500">Rp</span>
                            <p className="text-3xl font-black tracking-tight">
                              {activeFeature.displayPAD >= 1e12 
                                ? (activeFeature.displayPAD/1e12).toFixed(2) 
                                : (activeFeature.displayPAD/1e9).toFixed(1)}
                            </p>
                            <span className="text-sm font-black text-slate-500">
                              {activeFeature.displayPAD >= 1e12 ? 'T' : 'M'}
                            </span>
                          </div>
                          
                          <div className="mt-6 pt-6 border-t border-slate-800 flex justify-between items-center">
                             <div>
                               <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Anggaran</p>
                               <p className="text-sm font-black">
                                 Rp {activeFeature.displayAnggaran >= 1e12 
                                    ? (activeFeature.displayAnggaran/1e12).toFixed(2) + 'T' 
                                    : (activeFeature.displayAnggaran/1e9).toFixed(1) + 'M'}
                               </p>
                             </div>
                             <div className="text-right">
                               <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Capaian</p>
                               <p className={`text-sm font-black ${activeFeature.displayPAD >= activeFeature.displayAnggaran ? 'text-emerald-400' : 'text-amber-400'}`}>
                                 {((activeFeature.displayPAD / (activeFeature.displayAnggaran || 1)) * 100).toFixed(0)}%
                               </p>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-5">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Growth Trend</h4>
                       <div className="space-y-4">
                         {Object.entries(activeFeature.displayYearly || {})
                            .filter(([y]) => y >= 2021)
                            .sort(([a], [b]) => b - a)
                            .map(([year, val]) => {
                               const budget = activeFeature.displayYearlyAnggaran?.[year] || 0;
                               return (
                                <div key={year} className="group">
                                  <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-[11px] font-black text-slate-900 uppercase">{year}</span>
                                    <span className="text-[10px] font-black text-brand-600">
                                      Rp {val >= 1e12 ? (val/1e12).toFixed(2) + 'T' : (val/1e9).toFixed(1) + 'M'}
                                    </span>
                                  </div>
                                  <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-slate-900 rounded-full" style={{ width: budget > 0 ? `${Math.min(100, (val/budget)*100)}%` : (val > 0 ? '100%' : '0%') }} />
                                  </div>
                                </div>
                               );
                            })}
                       </div>
                    </div>

                    <button 
                      onClick={() => onDetailClick && onDetailClick(activeFeature)}
                      className="w-full py-5 bg-brand-500 text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest hover:bg-brand-600 transition-all active:scale-95 shadow-xl shadow-brand-500/20"
                    >
                      Rincian Dokumen Anggaran
                    </button>
                  </>
                )}
                
                {(() => {
                  const cleanName = (activeFeature?.daerah || '')
                    .toUpperCase()
                    .replace(/(PROVINSI|KABUPATEN|KOTA|DKI|DI|JAWA| )/g, '')
                    .trim();
                  const aiData = aiAnalysisData[cleanName];
                  
                  return aiData ? (
                    <div className="pb-10 border-t border-slate-100 pt-8">
                      <AiAnalysisPanel data={aiData} />
                    </div>
                  ) : null;
                })()}

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MapErrorBoundary>
  );
};

export default InteractiveMap;

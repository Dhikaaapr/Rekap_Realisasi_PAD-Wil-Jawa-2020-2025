import React from 'react';
const { useState, useMemo } = React;
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ResponsiveContainer, 
  LineChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  Line,
  AreaChart, Area,
  Legend
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  Search, 
  X,
  Check,
  AlertCircle,
  FileSpreadsheet,
  Download,
  CalendarDays,
  Activity,
  Map
} from 'lucide-react';
import * as XLSX from 'xlsx';

// Color palette for lines
const CHART_COLORS = [
  '#f43f5e', // rose
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#06b6d4', // cyan
];

const TrendKomparasi = ({ 
  data, // this is the array of all regions grouped with `yearly`, `yearlyPajak` etc.
  getProvinceName,
  AVAILABLE_YEARS = [2021, 2022, 2023, 2024, 2025]
}) => {
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMetric, setActiveMetric] = useState('yearly'); // yearly, yearlyPajak, etc.
  const [chartType, setChartType] = useState('line'); // line, area
  const [selectedYears, setSelectedYears] = useState(AVAILABLE_YEARS);

  const toggleYear = (year) => {
    setSelectedYears(prev => {
      if (prev.includes(year)) {
        if (prev.length === 1) return prev; // prevent hiding all years
        return prev.filter(y => y !== year);
      }
      return [...prev, year].sort();
    });
  };

  const metricsInfo = {
    yearly: { label: 'PAD Total', color: '#10b981' },
    yearlyPajak: { label: 'Pajak Daerah', color: '#3b82f6' },
    yearlyRetribusi: { label: 'Retribusi', color: '#f59e0b' },
    yearlyPengelolaan: { label: 'Hasil Pengelolaan', color: '#8b5cf6' },
    yearlyLain: { label: 'Lain-lain PAD', color: '#ec4899' },
  };

  // Set default regions on mount (if empty)
  React.useEffect(() => {
    if (selectedRegions.length === 0 && data.length > 0) {
      // Find top 3 provinces by default
      const topProvs = data
        .filter(d => d.tipe === 'Provinsi')
        .sort((a, b) => b.rataRataPAD - a.rataRataPAD)
        .slice(0, 3)
        .map(d => d.daerah);
      setSelectedRegions(topProvs);
    }
  }, [data, selectedRegions.length]);

  const toggleRegion = (daerah) => {
    setSelectedRegions(prev => {
      if (prev.includes(daerah)) return prev.filter(r => r !== daerah);
      if (prev.length >= 6) {
        alert("Maksimal 6 wilayah untuk dibandingkan secara bersamaan agar visualisasi tetap jelas.");
        return prev;
      }
      return [...prev, daerah];
    });
  };

  const filteredRegionsList = useMemo(() => {
    return data.filter(d => d.daerah.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [data, searchQuery]);

  // Construct chart data: 
  // [ { year: 2021, "DKI Jakarta": 50000, "Jawa Barat": 30000 }, { year: 2022, ... } ]
  const chartData = useMemo(() => {
    return selectedYears.map(year => {
      const yearObj = { year: year.toString() };
      selectedRegions.forEach(regionName => {
        const regionData = data.find(d => d.daerah === regionName);
        if (regionData && regionData[activeMetric]) {
          yearObj[regionName] = regionData[activeMetric][year] || 0;
        } else {
          yearObj[regionName] = 0;
        }
      });
      return yearObj;
    });
  }, [data, selectedRegions, activeMetric, selectedYears]);

  // Calculate Growth formatting logic
  const calculateGrowthData = useMemo(() => {
    return selectedRegions.map(regionName => {
      const regionData = data.find(d => d.daerah === regionName);
      if (!regionData) return null;
      
      const years = selectedYears.filter(y => regionData[activeMetric]?.[y]);
      const firstYear = Math.min(...years);
      const lastYear = Math.max(...years);
      
      const valStart = regionData[activeMetric]?.[firstYear] || 0;
      const valEnd = regionData[activeMetric]?.[lastYear] || 0;
      const pct = valStart > 0 ? ((valEnd - valStart) / valStart) * 100 : 0;
      const avg = years.length > 0 ? years.reduce((sum, y) => sum + (regionData[activeMetric]?.[y] || 0), 0) / years.length : 0;

      return {
        name: regionName,
        firstYear,
        lastYear,
        valStart,
        valEnd,
        growthPct: pct,
        avgValue: avg
      };
    }).filter(Boolean).sort((a,b) => b.growthPct - a.growthPct);
  }, [data, selectedRegions, activeMetric, selectedYears]);

  const formatValue = (val) => {
    if (val >= 1e12) return `Rp ${(val/1e12).toFixed(2)} T`;
    if (val >= 1e9) return `Rp ${(val/1e9).toFixed(1)} M`;
    return `Rp ${(val/1e6).toFixed(1)} Jt`;
  };

  const handleExport = () => {
    if (selectedRegions.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(chartData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tren_Multitahun");
    XLSX.writeFile(workbook, `Trend_Komparasi_${metricsInfo[activeMetric].label}.xlsx`);
  };

  return (
    <div className="space-y-6 md:space-y-10 mt-6 relative z-10">
      {/* Header and Controls */}
      <div className="bg-white/5 backdrop-blur-xl rounded-[32px] p-6 lg:p-10 border border-white/10 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 opacity-50 pointer-events-none" />
        
        <div className="flex flex-col xl:flex-row gap-10 items-start xl:items-center justify-between relative z-10">
          <div className="shrink-0">
            <h2 className="text-slate-900 font-black text-3xl md:text-4xl tracking-tighter uppercase flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-brand-400 to-indigo-600 rounded-2xl shadow-xl shadow-brand-500/30">
                <Activity className="text-white w-8 h-8" />
              </div>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-600 via-indigo-700 to-slate-800">
                Tren Komparasi
              </span>
            </h2>
            <p className="text-slate-500 mt-2 font-medium tracking-wide max-w-lg">
              Analisis deret waktu (Time-Series) multi-tahun antar wilayah di Jawa untuk memetakan pertumbuhan, disparitas, dan pemulihan performa PAD secara holistik.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
            <div className="w-full sm:w-auto flex flex-col gap-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-slate-500">Pilih Indikator</label>
              <select 
                value={activeMetric}
                onChange={(e) => setActiveMetric(e.target.value)}
                className="w-full sm:min-w-[200px] pl-4 pr-10 py-3.5 bg-white rounded-2xl border border-slate-200 text-slate-900 font-black text-sm outline-none appearance-none cursor-pointer hover:border-brand-300 focus:ring-2 focus:ring-brand-500 transition-all shadow-sm"
              >
                {Object.entries(metricsInfo).map(([key, info]) => (
                  <option key={key} value={key} className="bg-white text-slate-900 font-semibold">{info.label}</option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-auto flex flex-col gap-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-slate-500">Mode Visual</label>
              <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-full sm:w-max flex-wrap gap-1">
                <button onClick={() => setChartType('line')} className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${chartType === 'line' ? 'bg-brand-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-50'}`}>Garis</button>
                <button onClick={() => setChartType('area')} className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${chartType === 'area' ? 'bg-brand-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-50'}`}>Area</button>
              </div>
            </div>
            <div className="w-full sm:w-auto flex flex-col gap-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-slate-500">Filter Tahun</label>
              <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-full sm:w-max flex-wrap gap-1">
                {AVAILABLE_YEARS.map(year => (
                  <button 
                    key={year}
                    onClick={() => toggleYear(year)} 
                    className={`flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${selectedYears.includes(year) ? 'bg-brand-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-50'}`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-10">
        
        {/* Left Col: Region Selector */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-[32px] p-6 shadow-sm ring-1 ring-slate-100 flex flex-col h-[500px] xl:h-[600px]">
            <h3 className="text-slate-900 font-black text-lg flex items-center gap-3 tracking-tight mb-1">
              <Map className="text-brand-500" size={20} /> Entitas Wilayah
            </h3>
            <p className="text-slate-500 text-xs mb-5 font-medium leading-relaxed">
              Pilih hingga 6 entitas (Prov./Kab/Kota) untuk membandingkan matriks trend secara bersilangan.
            </p>
            
            <div className="relative mb-4 shrink-0">
              <input 
                type="text" 
                placeholder="Cari daerah..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl font-semibold text-sm focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all shadow-inner text-slate-800 placeholder:text-slate-400"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            </div>

            <div className="flex flex-wrap gap-2 mb-4 shrink-0 max-h-[100px] overflow-y-auto custom-scrollbar">
              <AnimatePresence>
                {selectedRegions.map(r => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    key={r} 
                    className="bg-brand-50 text-brand-700 border border-brand-200 pl-3 pr-1 py-1 rounded-full text-[11px] font-bold flex items-center gap-2 shadow-sm"
                  >
                    {r.replace(/^(Prov\.|Kab\.|Kota)\s+/g, '')}
                    <button onClick={() => toggleRegion(r)} className="p-1 hover:bg-brand-200 rounded-full transition-colors">
                      <X size={12} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2 relative">
              {filteredRegionsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400">
                  <Search size={32} className="mb-3 opacity-20" />
                  <p className="text-sm font-semibold">Tidak ditemukan daerah yang cocok.</p>
                </div>
              ) : (
                filteredRegionsList.map(item => {
                  const isSelected = selectedRegions.includes(item.daerah);
                  const isProv = item.tipe === 'Provinsi';
                  return (
                    <button
                      key={item.daerah}
                      onClick={() => toggleRegion(item.daerah)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all border outline-none
                        ${isSelected ? 'bg-brand-50 border-brand-500 shadow-md ring-1 ring-brand-500' : 'bg-white border-slate-100 hover:border-brand-300 hover:bg-slate-50'}`}
                    >
                      <div className="flex flex-col items-start gap-1">
                        <span className={`text-xs font-black tracking-wide ${isSelected ? 'text-brand-900' : 'text-slate-700'}`}>
                          {item.daerah}
                        </span>
                        <span className={`text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-md ${isProv ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {item.tipe}
                        </span>
                      </div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-300 ring-1 ring-inset ring-slate-200'}`}>
                        {isSelected && <Check size={12} strokeWidth={4} />}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Chart & Insights */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          <div className="bg-white rounded-[32px] p-6 lg:p-10 shadow-sm ring-1 ring-slate-100 flex flex-col min-h-[500px] xl:h-[600px] relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-50/50 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 relative z-10">
              <div>
                <h3 className="text-slate-900 font-black text-xl flex items-center gap-3 tracking-tight">
                  <TrendingUp className="text-emerald-500" /> Lintasan Performa {metricsInfo[activeMetric].label}
                </h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
                  <CalendarDays size={14} /> Periode Kumulatif YoY
                </p>
              </div>
              <button
                onClick={handleExport}
                disabled={selectedRegions.length === 0}
                className="flex items-center gap-2 bg-slate-900 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <Download size={14} className="group-hover:-translate-y-0.5 transition-transform" /> Export Data
              </button>
            </div>

            {selectedRegions.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <div className="p-4 bg-white rounded-2xl shadow-sm mb-4">
                  <BarChart3 className="text-slate-300 w-12 h-12" />
                </div>
                <h4 className="text-slate-600 font-bold text-lg">Belum Ada Wilayah Terpilih</h4>
                <p className="text-slate-400 text-sm max-w-sm mt-2">Silahkan pilih entitas provinsi atau kabupaten/kota di menu samping untuk memvisualisasikan data tren multi-tahun.</p>
              </div>
            ) : (
              <div className="flex-1 w-full relative z-10 h-full">
                <ResponsiveContainer width="100%" height="100%" className="min-h-[300px]">
                  {chartType === 'line' ? (
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis 
                        dataKey="year" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: '800' }} 
                        dy={15}
                      />
                      <YAxis 
                        tickFormatter={(val) => {
                          if (val >= 1e12) return `${(val/1e12).toFixed(0)}T`;
                          if (val >= 1e9) return `${(val/1e9).toFixed(0)}M`;
                          return val.toLocaleString('id-ID');
                        }}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: '700' }}
                        width={60}
                      />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', padding: '16px', backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}
                        formatter={(val) => [formatValue(val), '']}
                        labelStyle={{ color: '#0f172a', fontWeight: '900', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}
                        iconType="circle"
                      />
                      {selectedRegions.map((region, idx) => (
                        <Line 
                          key={region}
                          type="monotone" 
                          dataKey={region} 
                          name={region.replace(/^(Prov\.|Kab\.|Kota)\s+/g, '')}
                          stroke={CHART_COLORS[idx % CHART_COLORS.length]} 
                          strokeWidth={4}
                          dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                          activeDot={{ r: 7, strokeWidth: 0, fill: CHART_COLORS[idx % CHART_COLORS.length], className: 'drop-shadow-md' }}
                          animationDuration={1500}
                          label={(props) => {
                            const { x, y, value, index } = props;
                            if (index === 0) return null;
                            const prevVal = chartData[index - 1][region];
                            if (!prevVal || prevVal === 0) return null;
                            const growth = ((value - prevVal) / prevVal) * 100;
                            // Only show label if the change is valid
                            return (
                              <g transform={`translate(${x},${y})`}>
                                <text 
                                  x={0} 
                                  y={-12} 
                                  dy={0}
                                  textAnchor="middle" 
                                  fill={growth >= 0 ? '#10b981' : '#f43f5e'} 
                                  fontSize={10} 
                                  fontWeight="900"
                                >
                                  {growth >= 0 ? '▲' : '▼'}{Math.abs(growth).toFixed(1)}%
                                </text>
                              </g>
                            );
                          }}
                        />
                      ))}
                    </LineChart>
                  ) : (
                     <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <defs>
                        {selectedRegions.map((region, idx) => (
                           <linearGradient key={`grad-${region}`} id={`color${idx}`} x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor={CHART_COLORS[idx % CHART_COLORS.length]} stopOpacity={0.3}/>
                             <stop offset="95%" stopColor={CHART_COLORS[idx % CHART_COLORS.length]} stopOpacity={0}/>
                           </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: '800' }} dy={15}/>
                      <YAxis 
                         tickFormatter={(val) => {
                          if (val >= 1e12) return `${(val/1e12).toFixed(0)}T`;
                          if (val >= 1e9) return `${(val/1e9).toFixed(0)}M`;
                          return val.toLocaleString('id-ID');
                        }}
                        axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: '700' }} width={60}
                      />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                        formatter={(val) => [formatValue(val), '']}
                        labelStyle={{ color: '#0f172a', fontWeight: '900', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }} iconType="circle"/>
                      {selectedRegions.map((region, idx) => (
                        <Area 
                          key={region}
                          type="monotone" 
                          dataKey={region} 
                          name={region.replace(/^(Prov\.|Kab\.|Kota)\s+/g, '')}
                          stroke={CHART_COLORS[idx % CHART_COLORS.length]} 
                          fillOpacity={1} 
                          fill={`url(#color${idx})`} 
                          strokeWidth={3}
                          animationDuration={1500}
                        />
                      ))}
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Synthesis Section */}
      {selectedRegions.length > 0 && calculateGrowthData.length > 0 && (
         <div className="bg-gradient-to-br from-slate-900 to-brand-950 p-6 md:p-10 rounded-[32px] shadow-2xl relative overflow-hidden">
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-brand-500/20 rounded-full blur-[60px]" />
            <div className="absolute right-10 top-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-[40px]" />
            
            <div className="relative z-10">
              <h3 className="text-white font-black text-xl mb-8 flex items-center gap-3 tracking-wide">
                <AlertCircle className="text-amber-400" /> Sintesis Pertumbuhan Historis
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {calculateGrowthData.map((stat, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={stat.name} 
                    className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:bg-white/15 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[selectedRegions.indexOf(stat.name) % CHART_COLORS.length] }} />
                      <span className="text-white font-black text-xs truncate uppercase tracking-wider">{stat.name.replace(/^(Prov\.|Kab\.|Kota)\s+/g, '')}</span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-0.5">Pertumbuhan ({stat.firstYear}-{stat.lastYear})</p>
                        <p className={`text-xl font-black ${stat.growthPct >= 0 ? 'text-emerald-400' : 'text-rose-400'} flex items-center gap-1`}>
                          {stat.growthPct >= 0 ? '↗' : '↘'} {Math.abs(stat.growthPct).toFixed(1)}%
                        </p>
                      </div>
                      <div className="flex items-end justify-between">
                         <div>
                          <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-0.5">Rata-rata/Tahun</p>
                          <p className="text-slate-200 text-sm font-bold">{formatValue(stat.avgValue)}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
         </div>
      )}
      
    </div>
  );
};

export default TrendKomparasi;

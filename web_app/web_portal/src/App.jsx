import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Map, 
  LayoutDashboard, 
  Search,
  Database,
  ArrowUpRight,
  PieChart as PieIcon,
  ChevronDown,
  Lightbulb,
  Sparkles,
  Menu,
  X,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Star,
  AlertCircle,
  Globe,
  RefreshCw,
  BarChart2,
  Building2,
  Award,
  Filter,
  Layers,
  AlertTriangle
} from 'lucide-react';
import { fetchPadData, PROVINCE_KABKOTA, fetchKategoriPad, fetchDetailDataByCategory } from './lib/supabase';
import StatCard from './components/StatCard';
import RegionCard from './components/RegionCard';
import DetailModal from './components/DetailModal';
import DataMaster from './components/DataMaster';
import PetaData from './components/PetaData';
import JavaMap from './components/JavaMap';
import Visualisasi from './components/Visualisasi';
import CollapsibleSubSection from './components/CollapsibleSubSection';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
  LabelList
} from 'recharts';
import AiAnalysisPanel from './components/AiAnalysisPanel';
import { aiAnalysisData } from './data/aiAnalysisData';

// =====================
// PROVINCE MAPPING (using authoritative whitelist from supabase.js)
// =====================
const PROVINCE_DISPLAY_NAMES = {
  'DKI Jakarta': 'DKI Jakarta',
  'Prov. Banten': 'Banten',
  'Prov. Jawa Barat': 'Jawa Barat',
  'Prov. Jawa Tengah': 'Jawa Tengah',
  'Prov. DI Yogyakarta': 'DIY Yogyakarta',
  'Prov. Jawa Timur': 'Jawa Timur',
};

// Build reverse lookup: daerah name → province key
const DAERAH_TO_PROVINCE = {};
for (const [provKey, kabKotaList] of Object.entries(PROVINCE_KABKOTA)) {
  // Province itself maps to itself
  DAERAH_TO_PROVINCE[provKey] = provKey;
  // Each kab/kota maps to its province
  for (const kk of kabKotaList) {
    DAERAH_TO_PROVINCE[kk] = provKey;
  }
}

const getProvinceName = (daerah) => {
  if (!daerah) return 'Lainnya';
  const provKey = DAERAH_TO_PROVINCE[daerah];
  if (provKey) return PROVINCE_DISPLAY_NAMES[provKey] || provKey;
  return 'Lainnya';
};

// =====================
// UTILITY
// =====================
const formatCurrencyShort = (val) => {
  if (!val) return 'Rp 0';
  if (val >= 1e12) return `Rp ${(val / 1e12).toFixed(2)} T`;
  if (val >= 1e9) return `Rp ${(val / 1e9).toFixed(1)} M`;
  return `Rp ${(val / 1e6).toFixed(0)} Jt`;
};

// =====================
// NAV ITEMS CONFIG
// =====================
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'Ringkasan eksekutif' },
  { id: 'charts', label: 'Visualisasi', icon: BarChart2, desc: 'Grafik & analitik' },
  { id: 'peta-data', label: 'Peta Wilayah', icon: Globe, desc: 'Distribusi geografis' },
  { id: 'data-master', label: 'Data Master', icon: Database, desc: 'Tabel lengkap' },
];

const METRICS = [
  { id: 'rataRataPAD', label: 'PAD Total', icon: LayoutDashboard, color: 'bg-brand-500 border-brand-500 text-white shadow-brand-500/20' },
  { id: 'rataRataPajak', label: 'Pajak Daerah', icon: TrendingUp, color: 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-600/20' },
  { id: 'rataRataRetribusi', label: 'Retribusi', icon: BarChart3, color: 'bg-emerald-600 border-emerald-600 text-white shadow-emerald-600/20' },
  { id: 'rataRataPengelolaan', label: 'Pengelolaan', icon: Database, color: 'bg-blue-600 border-blue-600 text-white shadow-blue-600/20' },
  { id: 'rataRataLain', label: 'Lain-lain PAD', icon: PieIcon, color: 'bg-amber-500 border-amber-500 text-white shadow-amber-500/20' },
];

// =====================
// COLLAPSIBLE SECTION
// =====================
const CollapsibleSection = ({ title, data, metricKey, label, color, onRegionClick, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [subPage, setSubPage] = useState(0);
  const PAGE_SIZE = 10;

  const sortedData = useMemo(() => [...data].sort((a, b) => b[metricKey] - a[metricKey]), [data, metricKey]);
  const top10 = sortedData.slice(0, 10);
  const middle = sortedData.slice(10, sortedData.length > 20 ? -10 : undefined);
  const bottom10 = sortedData.length > 20 ? sortedData.slice(-10) : [];

  const colorMap = { 
    brand: { ring: 'ring-brand-200', bg: 'bg-brand-500', text: 'text-brand-600', light: 'bg-brand-50', hdr: 'from-brand-500' },
    indigo: { ring: 'ring-indigo-200', bg: 'bg-indigo-500', text: 'text-indigo-600', light: 'bg-indigo-50', hdr: 'from-indigo-600' },
    emerald: { ring: 'ring-emerald-200', bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50', hdr: 'from-emerald-600' },
    blue: { ring: 'ring-blue-200', bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50', hdr: 'from-blue-600' },
    amber: { ring: 'ring-amber-200', bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50', hdr: 'from-amber-500' },
  };
  const c = colorMap[color] || colorMap.brand;

  return (
    <div className={`bg-slate-900/60 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/10 transition-all duration-300`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-4 p-5 md:p-7 hover:bg-white/5 transition-colors"
      >
        <div className={`w-12 h-12 rounded-2xl ${c.bg} flex items-center justify-center text-white shadow-lg`}>
          {Icon && <Icon size={20} />}
        </div>
        <div className="text-left flex-grow">
          <h3 className="text-base md:text-lg font-black text-white uppercase tracking-tight">{title}</h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
            {sortedData.length} wilayah • {isOpen ? 'klik untuk tutup' : 'klik untuk lihat'}
          </p>
        </div>
        {sortedData.length > 0 && (
          <div className={`text-right mr-4 hidden sm:block`}>
            <p className="text-[10px] font-black text-slate-500 uppercase">Tertinggi</p>
            <p className={`text-sm font-black ${c.text}`}>{formatCurrencyShort(sortedData[0]?.[metricKey] || 0)}</p>
            <p className="text-[10px] text-slate-500">{sortedData[0]?.daerah?.replace('Prov. ', '')}</p>
          </div>
        )}
        <div className={`p-2.5 rounded-xl transition-all duration-300 ${isOpen ? `${c.light} ${c.text}` : 'bg-white/5 text-slate-500'}`}>
          <ChevronDown size={20} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="border-t border-white/10"
          >
            <div className="p-5 md:p-7 space-y-6">
              {top10.length > 0 && (
                <CollapsibleSubSection badgeText="🏆 Performance Terbaik (Top 10)" badgeColor="bg-emerald-50 text-emerald-700" defaultOpen={true}>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                    {top10.map((region, idx) => (
                      <RegionCard key={`${region.id}-top`} region={region} rank={idx + 1} isTop value={region[metricKey]} label={label} onClick={() => onRegionClick(region)} />
                    ))}
                  </div>
                </CollapsibleSubSection>
              )}
              {middle.length > 0 && (
                <CollapsibleSubSection badgeText={`📊 Wilayah Lainnya (${middle.length} wilayah)`} badgeColor="bg-slate-50 text-slate-500" defaultOpen={false}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {middle.map((region, idx) => (
                      <RegionCard key={`${region.id}-mid`} region={region} rank={idx + 11} value={region[metricKey]} label={label} onClick={() => onRegionClick(region)} />
                    ))}
                  </div>
                </CollapsibleSubSection>
              )}
              {bottom10.length > 0 && (
                <CollapsibleSubSection badgeText="⚠️ Perlu Perhatian (Bottom 10)" badgeColor="bg-rose-50 text-rose-600" defaultOpen={false}>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                    {bottom10.map((region, idx) => (
                      <RegionCard key={`${region.id}-bot`} region={region} rank={sortedData.length - 10 + idx + 1} isBottom value={region[metricKey]} label={label} onClick={() => onRegionClick(region)} />
                    ))}
                  </div>
                </CollapsibleSubSection>
              )}
            </div>
            <div className="bg-white/5 py-3 text-center border-t border-white/10">
              <button onClick={() => setIsOpen(false)} className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-brand-400 transition-colors">
                ↑ Tutup Tampilan
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// =====================
// PROVINCE STATS CARD
// =====================
const ProvinceCard = ({ name, value, rank, color, onClick, isSelected, budget = 0 }) => {
  const pct = budget > 0 ? (value / budget) * 100 : 0;
  return (
    <div onClick={onClick} className={`flex flex-col gap-2 p-3 rounded-xl hover:bg-white/10 hover:shadow-lg transition-all cursor-pointer group border ${
      isSelected ? 'bg-brand-500/20 border-brand-500/50 ring-1 ring-brand-500/30' : 'bg-white/5 border-white/5'
    }`}>
      <div className="flex items-center gap-3">
        <span className="text-xs font-black text-slate-600 w-5 text-center">#{rank}</span>
        <div className={`w-2.5 h-2.5 rounded-full ${color} shrink-0`} />
        <span className={`font-bold text-xs flex-grow transition-colors ${
          isSelected ? 'text-brand-400' : 'text-slate-300 group-hover:text-brand-400'
        }`}>{name}</span>
        <span className="font-black text-white text-xs">{formatCurrencyShort(value)}</span>
        <ChevronDown size={12} className={`transition-transform duration-300 ${
          isSelected ? 'rotate-180 text-brand-400' : 'text-slate-600 group-hover:text-brand-400'
        }`} />
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden ml-8">
        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, pct)}%` }} className={`h-full ${color}`} />
      </div>
    </div>
  );
};

// =====================
// MAIN APP
// =====================
function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeMetric, setActiveMetric] = useState('rataRataPAD');
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [activeInsight, setActiveInsight] = useState(null);
  const [selectedYear, setSelectedYear] = useState('all'); // Changed from 2025 to 'all'
  const [globalProvFilter, setGlobalProvFilter] = useState('all'); // Added new state
  const [globalKabKotaFilter, setGlobalKabKotaFilter] = useState('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState(null);
  
  // Granular Filter States
  const [categories, setCategories] = useState([]);
  const [activeSubMetric, setActiveSubMetric] = useState('all');
  const [tempSubMetric, setTempSubMetric] = useState('all');
  const [regionalSubData, setRegionalSubData] = useState({});
  const [isSubLoading, setIsSubLoading] = useState(false);
  const [isDashFilterOpen, setIsDashFilterOpen] = useState(false);
  const [dashSearchQuery, setDashSearchQuery] = useState('');
  const [tempDashSelected, setTempDashSelected] = useState(new Set());
  const [showCelebrate, setShowCelebrate] = useState(false);

  // Celebration trigger function
  const triggerCelebration = () => {
    setShowCelebrate(true);
    setTimeout(() => setShowCelebrate(false), 2000);
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const rawData = await fetchPadData();
      const normalized = rawData.map(d => ({
        id: d.id,
        tahun: d.tahun,
        daerah: d.daerah,
        nomor_urut: d.nomor_urut,
        pajakAnggaran: d.pajak_anggaran || 0,
        pajakRealisasi: d.pajak_realisasi || 0,
        retribusiAnggaran: d.retribusi_anggaran || 0,
        retribusiRealisasi: d.retribusi_realisasi || 0,
        pengelolaanAnggaran: d.pengelolaan_anggaran || 0,
        pengelolaanRealisasi: d.pengelolaan_realisasi || 0,
        lainPadAnggaran: d.lain_pad_anggaran || 0,
        lainPadRealisasi: d.lain_pad_realisasi || 0,
      }));

      const grouped = normalized.reduce((acc, curr) => {
        const name = curr.daerah || 'Unknown';
        if (!acc[name]) {
          acc[name] = {
            id: name.replace(/\s+/g, '-').toLowerCase(),
            daerah: name,
            tipe: (name.toLowerCase().startsWith('prov') || name === 'DKI Jakarta') ? 'Provinsi' : name.toLowerCase().startsWith('kab') ? 'Kabupaten' : 'Kota',
            dataPerTahun: [],
            tahunList: []
          };
        }
        acc[name].dataPerTahun.push(curr);
        acc[name].tahunList.push(curr.tahun);
        return acc;
      }, {});

      const processedData = Object.values(grouped).map(group => {
        const tots = group.dataPerTahun.reduce((acc, d) => ({
          totalRealisasi: acc.totalRealisasi + d.pajakRealisasi + d.retribusiRealisasi + d.pengelolaanRealisasi + d.lainPadRealisasi,
          totalAnggaran: acc.totalAnggaran + d.pajakAnggaran + d.retribusiAnggaran + d.pengelolaanAnggaran + d.lainPadAnggaran,
          totalPajak: acc.totalPajak + d.pajakRealisasi,
          totalRetribusi: acc.totalRetribusi + d.retribusiRealisasi,
          totalPengelolaan: acc.totalPengelolaan + d.pengelolaanRealisasi,
          totalLain: acc.totalLain + d.lainPadRealisasi,
          totalPajakAnggaran: acc.totalPajakAnggaran + d.pajakAnggaran,
          totalRetribusiAnggaran: acc.totalRetribusiAnggaran + d.retribusiAnggaran,
          totalPengelolaanAnggaran: acc.totalPengelolaanAnggaran + d.pengelolaanAnggaran,
          totalLainAnggaran: acc.totalLainAnggaran + d.lainPadAnggaran,
        }), { 
          totalRealisasi: 0, totalAnggaran: 0, totalPajak: 0, totalRetribusi: 0, totalPengelolaan: 0, totalLain: 0,
          totalPajakAnggaran: 0, totalRetribusiAnggaran: 0, totalPengelolaanAnggaran: 0, totalLainAnggaran: 0 
        });

        const n = group.dataPerTahun.length || 1;
        return {
          ...group,
          ...tots,
          rataRataPAD: tots.totalRealisasi / n,
          rataRataAnggaran: tots.totalAnggaran / n,
          rataRataPajak: tots.totalPajak / n,
          rataRataRetribusi: tots.totalRetribusi / n,
          rataRataPengelolaan: tots.totalPengelolaan / n,
          rataRataLain: tots.totalLain / n,
          yearly: group.dataPerTahun.reduce((acc, d) => {
            acc[d.tahun] = d.pajakRealisasi + d.retribusiRealisasi + d.pengelolaanRealisasi + d.lainPadRealisasi;
            return acc;
          }, {}),
          yearlyAnggaran: group.dataPerTahun.reduce((acc, d) => {
            acc[d.tahun] = d.pajakAnggaran + d.retribusiAnggaran + d.pengelolaanAnggaran + d.lainPadAnggaran;
            return acc;
          }, {}),
          yearlyPajak: group.dataPerTahun.reduce((acc, d) => { acc[d.tahun] = d.pajakRealisasi; return acc; }, {}),
          yearlyRetribusi: group.dataPerTahun.reduce((acc, d) => { acc[d.tahun] = d.retribusiRealisasi; return acc; }, {}),
          yearlyPengelolaan: group.dataPerTahun.reduce((acc, d) => { acc[d.tahun] = d.pengelolaanRealisasi; return acc; }, {}),
          yearlyLain: group.dataPerTahun.reduce((acc, d) => { acc[d.tahun] = d.lainPadRealisasi; return acc; }, {}),
        };
      });

      processedData.sort((a, b) => b.rataRataPAD - a.rataRataPAD);
      setData(processedData);
      if (processedData.length > 0) setActiveInsight(processedData[0]);

      // Fetch categories once
      const cats = await fetchKategoriPad();
      setCategories(cats);

      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Fetch sub-metric data when selection changes
  useEffect(() => {
    const fetchSubData = async () => {
      if (activeSubMetric === 'all') {
        setRegionalSubData({});
        return;
      }
      setIsSubLoading(true);
      try {
        const codesToFetch = Array.isArray(activeSubMetric) ? activeSubMetric : (activeSubMetric === 'all' ? [] : [activeSubMetric]);
        const results = await fetchDetailDataByCategory(selectedYear, codesToFetch);
        // Map to normalized daerah key for reliable lookup
        const mapped = {};
        results.forEach(r => {
          // Normalizing the daerah name from detail data to match our canonical names
          const normName = r.daerah.toUpperCase()
            .replace(/(PROV\.|PROVINSI|KAB\.|KABUPATEN|KOTA|DKI|DI|JAWA| )/g, '')
            .trim();
            
          // Find the matching canonical name from the data we already have
          const canonical = data.find(d => {
            const dNorm = d.daerah.toUpperCase()
              .replace(/(PROV\.|PROVINSI|KAB\.|KABUPATEN|KOTA|DKI|DI|JAWA| )/g, '')
              .trim();
            return dNorm === normName;
          })?.daerah || r.daerah;

          if (!mapped[canonical]) mapped[canonical] = { realisasi: 0, anggaran: 0, yearly: {} };
          mapped[canonical].realisasi += r.realisasi || 0;
          mapped[canonical].anggaran += r.anggaran || 0;
          if (!mapped[canonical].yearly[r.tahun]) mapped[canonical].yearly[r.tahun] = 0;
          mapped[canonical].yearly[r.tahun] += r.realisasi || 0;
        });
        setRegionalSubData(mapped);
      } catch (err) {
        console.error("Sub-metric fetch fail:", err);
      } finally {
        setIsSubLoading(false);
      }
    };
    fetchSubData();
  }, [activeSubMetric, selectedYear]);



  // Filter categories based on active main metric
  // Grouped Categories for the Mega Filter
  const groupedCategories = useMemo(() => {
    const groups = {
      'PAJAK': [],
      'RETRIBUSI': [],
      'PENGELOLAAN': [],
      'LAIN-LAIN': []
    };
    
    categories.forEach(c => {
      const catUpper = (c.kategori_utama || '').toString().toUpperCase();
      if (catUpper.includes('PAJAK')) groups['PAJAK'].push(c);
      else if (catUpper.includes('RETRIBUSI')) groups['RETRIBUSI'].push(c);
      else if (catUpper.includes('PENGELOLAAN')) groups['PENGELOLAAN'].push(c);
      else groups['LAIN-LAIN'].push(c);
    });
    
    return groups;
  }, [categories]);

  const [dashActiveGroup, setDashActiveGroup] = useState('PAJAK');

  const filteredCategories = useMemo(() => {
    if (activeMetric === 'rataRataPAD') return groupedCategories[dashActiveGroup] || [];
    
    const mapping = {
      'rataRataPajak': 'PAJAK',
      'rataRataRetribusi': 'RETRIBUSI',
      'rataRataPengelolaan': 'PENGELOLAAN',
      'rataRataLain': 'LAIN-LAIN'
    };
    
    const targetGroup = mapping[activeMetric];
    return groupedCategories[targetGroup] || [];
  }, [groupedCategories, activeMetric, dashActiveGroup]);

  // Reset sub-metric when main metric changes
  useEffect(() => {
    setActiveSubMetric('all');
    setTempSubMetric('all');
  }, [activeMetric]);

  // Year-filtered or All-years aggregated data
  // 119 Wilayah total (including 6 Provinces)
  const activeYearData = useMemo(() => {
    const isVisibleInList = (d) => {
      // Province filtering
      if (globalProvFilter !== 'all') {
        const kabKotaInProv = new Set(PROVINCE_KABKOTA[globalProvFilter] || []);
        
        // If specific Kab/Kota selected, only show that
        if (globalKabKotaFilter !== 'all') {
          return d.daerah === globalKabKotaFilter;
        }
        
        if (d.daerah !== globalProvFilter && !kabKotaInProv.has(d.daerah)) return false;
      }

      // Show everything in the 119 whitelist (6 Prov + 113 Kab/Kota)
      return true;
    };

    if (selectedYear === 'all') {
      return data.filter(isVisibleInList).map(group => {
        let val = group.totalRealisasi;
        let pjk = group.totalPajak;
        let ret = group.totalRetribusi;
        let pen = group.totalPengelolaan;
        let lai = group.totalLain;
        let ang = group.totalAnggaran;

        if (activeSubMetric !== 'all') {
           const subRow = regionalSubData[group.daerah];
           // If sub-metric active, use sub-data if exists, otherwise 0
           const subVal = subRow ? subRow.realisasi : 0;
           const subAng = subRow ? subRow.anggaran : 0;
           
           val = subVal;
           ang = subAng;
           
           if (activeMetric === 'rataRataPajak') pjk = subVal;
           else if (activeMetric === 'rataRataRetribusi') ret = subVal;
           else if (activeMetric === 'rataRataPengelolaan') pen = subVal;
           else if (activeMetric === 'rataRataLain') lai = subVal;
        }

        return {
          ...group,
          rataRataPAD: val,
          rataRataPajak: pjk,
          rataRataRetribusi: ret,
          rataRataPengelolaan: pen,
          rataRataLain: lai,
          rataRataAnggaran: ang,
          capaianAgg: ang > 0 ? (val / ang) * 100 : 0
        };
      }).filter(Boolean);
    }

    return data.filter(isVisibleInList).map(group => {
      const yr = group.dataPerTahun.find(r => r.tahun === selectedYear);
      if (!yr) return null;

      let val = yr.pajakRealisasi + yr.retribusiRealisasi + yr.pengelolaanRealisasi + yr.lainPadRealisasi;
      let pjk = yr.pajakRealisasi;
      let ret = yr.retribusiRealisasi;
      let pen = yr.pengelolaanRealisasi;
      let lai = yr.lainPadRealisasi;
      let ang = yr.pajakAnggaran + yr.retribusiAnggaran + yr.pengelolaanAnggaran + yr.lainPadAnggaran;

      if (activeSubMetric !== 'all') {
         const subRow = regionalSubData[group.daerah];
         const subVal = subRow ? subRow.realisasi : 0;
         const subAng = subRow ? subRow.anggaran : 0;
         
         val = subVal;
         ang = subAng;
         
         if (activeMetric === 'rataRataPajak') pjk = subVal;
         else if (activeMetric === 'rataRataRetribusi') ret = subVal;
         else if (activeMetric === 'rataRataPengelolaan') pen = subVal;
         else if (activeMetric === 'rataRataLain') lai = subVal;
      }

      return {
        ...group, ...yr,
        rataRataPAD: val,
        rataRataPajak: pjk,
        rataRataRetribusi: ret,
        rataRataPengelolaan: pen,
        rataRataLain: lai,
        rataRataAnggaran: ang,
      };
    }).filter(Boolean);
  }, [data, selectedYear, globalProvFilter, globalKabKotaFilter, activeSubMetric, regionalSubData]);

  // Update insight whenever activeYearData changes to ensure it matches the new filter values
  useEffect(() => {
    if (activeYearData && activeYearData.length > 0) {
      const sorted = [...activeYearData].sort((a, b) => b[activeMetric] - a[activeMetric]);
      if (sorted.length > 0) setActiveInsight(sorted[0]);
    }
  }, [activeYearData, activeMetric]);

  const stats = useMemo(() => {
    // We sum the 6 Province entries to get Jawa-wide totals
    const provinceEntries = activeYearData.filter(d => d.tipe === 'Provinsi');
    
    return {
      totalDaerah: 119,
      totalRealisasi: provinceEntries.reduce((s, d) => s + (d.rataRataPAD || 0), 0),
      totalPajak: provinceEntries.reduce((s, d) => s + (d.rataRataPajak || 0), 0),
      totalRetribusi: provinceEntries.reduce((s, d) => s + (d.rataRataRetribusi || 0), 0),
      totalAnggaran: provinceEntries.reduce((s, d) => s + (d.rataRataAnggaran || 0), 0),
    };
  }, [activeYearData]);

  const filteredData = useMemo(() => 
    activeYearData.filter(item => item.daerah.toLowerCase().includes(searchQuery.toLowerCase())),
    [activeYearData, searchQuery]
  );

  const provincialRanking = useMemo(() => 
    activeYearData
      .filter(d => d.tipe === 'Provinsi' && d[activeMetric] > 0)
      .sort((a, b) => b[activeMetric] - a[activeMetric])
      .map((d, index) => ({
        ...d,
        rank: index + 1,
        name: d.daerah.replace('Prov. ', ''),
        displayName: `${index + 1}. ${d.daerah.replace('Prov. ', '')}`,
        value: d[activeMetric]
      })),
    [activeYearData, activeMetric]
  );

  const top10Prov = useMemo(() => provincialRanking.slice(0, 10), [provincialRanking]);

  const regionalRanking = useMemo(() => 
    activeYearData
      .filter(d => d.tipe !== 'Provinsi' && d[activeMetric] > 0)
      .sort((a, b) => b[activeMetric] - a[activeMetric])
      .map((d, index) => ({
        ...d,
        rank: index + 1,
        name: d.daerah.replace('Kab. ', '').replace('Kota ', ''),
        displayName: `${index + 1}. ${d.daerah.replace('Kab. ', '').replace('Kota ', '')}`,
        value: d[activeMetric]
      })),
    [activeYearData, activeMetric]
  );

  const top10KabKota = useMemo(() => 
    activeYearData
      .filter(d => d.tipe !== 'Provinsi')
      .sort((a, b) => b[activeMetric] - a[activeMetric])
      .slice(0, 10)
      .map(d => ({
        ...d,
        name: d.daerah.replace('Kab. ', '').replace('Kota ', ''),
        value: d[activeMetric]
      })),
    [activeYearData, activeMetric]
  );

  // Province aggregation
  const provinceStats = useMemo(() => {
    const provs = [
      { name: 'DKI Jakarta', provKey: 'DKI Jakarta', color: 'bg-brand-500' },
      { name: 'Jawa Barat', provKey: 'Prov. Jawa Barat', color: 'bg-blue-600' },
      { name: 'Jawa Timur', provKey: 'Prov. Jawa Timur', color: 'bg-emerald-600' },
      { name: 'Jawa Tengah', provKey: 'Prov. Jawa Tengah', color: 'bg-amber-500' },
      { name: 'Banten', provKey: 'Prov. Banten', color: 'bg-indigo-500' },
      { name: 'DIY Yogyakarta', provKey: 'Prov. DI Yogyakarta', color: 'bg-rose-500' },
    ];
    return provs.map(p => {
      const kabKotaNames = new Set(PROVINCE_KABKOTA[p.provKey] || []);
      // Penting: we need the Province Entry itself for data, especially for DKI
      const provinceEntry = data.find(group => group.daerah === p.provKey);
      const provinceYearly = selectedYear === 'all' 
        ? {
            pajakRealisasi: provinceEntry?.totalPajak || 0,
            retribusiRealisasi: provinceEntry?.totalRetribusi || 0,
            pengelolaanRealisasi: provinceEntry?.totalPengelolaan || 0,
            lainPadRealisasi: provinceEntry?.totalLain || 0,
            pajakAnggaran: provinceEntry?.totalPajakAnggaran || 0,
            retribusiAnggaran: provinceEntry?.totalRetribusiAnggaran || 0,
            pengelolaanAnggaran: provinceEntry?.totalPengelolaanAnggaran || 0,
            lainPadAnggaran: provinceEntry?.totalLainAnggaran || 0
          }
        : provinceEntry?.dataPerTahun.find(yr => yr.tahun === selectedYear) || {
            pajakRealisasi: 0, retribusiRealisasi: 0, pengelolaanRealisasi: 0, lainPadRealisasi: 0,
            pajakAnggaran: 0, retribusiAnggaran: 0, pengelolaanAnggaran: 0, lainPadAnggaran: 0
          };

      // If it's Jakarta, use provinceEntry directly. 
      // For others, we can either use provinceEntry or sum of kabkota.
      // Usually provinceEntry is the most reliable consolidated source.
      let val = 0;
      if (selectedYear === 'all') {
        val = provinceEntry?.[activeMetric.replace('rataRata', 'total')] || provinceEntry?.[activeMetric] || 0;
      } else {
        const yr = provinceEntry?.dataPerTahun.find(r => r.tahun === selectedYear);
        if (yr) {
          if (activeMetric === 'rataRataPAD') val = yr.pajakRealisasi + yr.retribusiRealisasi + yr.pengelolaanRealisasi + yr.lainPadRealisasi;
          else if (activeMetric === 'rataRataPajak') val = yr.pajakRealisasi;
          else if (activeMetric === 'rataRataRetribusi') val = yr.retribusiRealisasi;
          else if (activeMetric === 'rataRataPengelolaan') val = yr.pengelolaanRealisasi;
          else if (activeMetric === 'rataRataLain') val = yr.lainPadRealisasi;
          else if (activeMetric === 'rataRataAnggaran') val = yr.pajakAnggaran + yr.retribusiAnggaran + yr.pengelolaanAnggaran + yr.lainPadAnggaran;
        }
      }

      return {
        ...p,
        value: val,
        budget: provinceYearly.pajakAnggaran + provinceYearly.retribusiAnggaran + provinceYearly.pengelolaanAnggaran + provinceYearly.lainPadAnggaran,
        breakdown: {
          pajak: provinceYearly.pajakRealisasi,
          retribusi: provinceYearly.retribusiRealisasi,
          pengelolaan: provinceYearly.pengelolaanRealisasi,
          lain: provinceYearly.lainPadRealisasi,
          pajakAng: provinceYearly.pajakAnggaran,
          retribusiAng: provinceYearly.retribusiAnggaran,
          pengelolaanAng: provinceYearly.pengelolaanAnggaran,
          lainAng: provinceYearly.lainPadAnggaran
        },
        count: kabKotaNames.size,
      };
    }).sort((a, b) => b.value - a.value);
  }, [data, selectedYear, activeMetric]);

  // Province drill-down: kab/kota within selected province
  const provinceKabKotaData = useMemo(() => {
    if (!selectedProvince) return [];
    const provInfo = provinceStats.find(p => p.name === selectedProvince);
    if (!provInfo) return [];
    const kabKotaNames = new Set(PROVINCE_KABKOTA[provInfo.provKey] || []);
    
    // For Jakarta, also include the Adm. cities even if they are 0
    return activeYearData
      .filter(d => kabKotaNames.has(d.daerah))
      .sort((a, b) => b[activeMetric] - a[activeMetric]);
  }, [selectedProvince, activeYearData, activeMetric, provinceStats]);

  // =====================
  // LOADING SCREEN
  // =====================
  if (loading) {
    return (
      <div className="min-h-screen bg-brand-900 flex flex-col items-center justify-center relative overflow-hidden">
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.18, 0.08] }} transition={{ duration: 4, repeat: Infinity }} className="absolute w-[700px] h-[700px] bg-brand-500 rounded-full blur-[150px] -top-48 -left-48" />
        <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.12, 0.05] }} transition={{ duration: 5, repeat: Infinity, delay: 1 }} className="absolute w-[500px] h-[500px] bg-blue-600 rounded-full blur-[120px] -bottom-24 -right-24" />
        <div className="relative z-10 flex flex-col items-center text-center px-8">
          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.7, ease: 'backOut' }} className="mb-10 relative">
            <div className="w-24 h-24 bg-brand-500 rounded-[28px] flex items-center justify-center shadow-2xl shadow-brand-500/40">
              <Database size={40} className="text-white" />
            </div>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} className="absolute -inset-4 border-2 border-dashed border-brand-400/30 rounded-[40px]" />
          </motion.div>
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
            <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">
              PAD Jawa <span className="text-brand-400 font-light">Portal</span>
            </h2>
            <p className="text-brand-300 text-sm font-medium mb-8">Sistem Analitik Pendapatan Asli Daerah</p>
            <div className="flex items-center justify-center gap-3">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} animate={{ scaleY: [1, 2.5, 1] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }} className="w-1.5 h-5 bg-brand-400 rounded-full" />
                ))}
              </div>
              <p className="text-brand-300 text-xs font-black uppercase tracking-widest">Sinkronisasi Pusat Data Analitik...</p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="mt-10 flex gap-3 text-[10px] text-brand-500 uppercase tracking-widest">
            {['Data 2021-2025', '•', '119 Wilayah Jawa'].map((t, i) => <span key={i}>{t}</span>)}
          </motion.div>
        </div>
        <p className="absolute bottom-8 text-[10px] text-white/30 font-black uppercase tracking-[0.4em]">Executive Decision Support System</p>
      </div>
    );
  }

  // =====================
  // ERROR SCREEN
  // =====================
  if (error) {
    return (
      <div className="min-h-screen bg-rose-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-rose-100 text-rose-500 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-rose-200">
          <AlertCircle size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Gagal Memuat Data</h2>
        <p className="text-rose-600 max-w-md mb-8 text-sm">{error}</p>
        <button onClick={fetchData} className="flex items-center gap-2 px-8 py-4 bg-brand-500 text-white rounded-2xl font-black hover:bg-brand-600 transition-all shadow-xl shadow-brand-500/20">
          <RefreshCw size={18} /> Coba Lagi
        </button>
      </div>
    );
  }

  // =====================
  // MAIN LAYOUT
  // =====================
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0c1427] via-[#020617] to-[#01030e] flex flex-col lg:flex-row relative">
      
      {/* ===== MOBILE HEADER ===== */}
      <div className="lg:hidden bg-brand-900 text-white p-4 flex items-center justify-between sticky top-0 z-30 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg">
            <Database size={18} />
          </div>
          <div>
            <h1 className="font-black text-base tracking-tight uppercase leading-none">PAD Jawa</h1>
            <p className="text-brand-400 text-[9px] font-bold uppercase tracking-widest">{selectedYear}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest hidden xs:block">● Live</span>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2.5 bg-brand-800 rounded-xl text-white active:scale-95 transition-transform">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile backdrop */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-brand-900/70 backdrop-blur-sm z-40 lg:hidden" />
        )}
      </AnimatePresence>

      {/* ===== SIDEBAR ===== */}
      <aside className={`w-72 bg-brand-900 text-white flex flex-col fixed lg:sticky top-0 h-screen z-50 transition-all duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Sidebar Header */}
        <div className="p-7 border-b border-brand-800/60">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-11 h-11 bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl flex items-center justify-center shadow-xl shadow-brand-500/30">
              <Database size={22} className="text-white" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight leading-none uppercase">PAD Jawa</h1>
              <p className="text-[9px] text-brand-400 font-bold uppercase tracking-widest mt-0.5">Sistem Rekapitulasi</p>
            </div>
          </div>
        </div>

        {/* Year Quick Selector */}
        <div className="px-5 py-4 border-b border-brand-800/40">
          <p className="text-[9px] text-brand-500 font-black uppercase tracking-widest mb-2">📅 Periode Data</p>
          <div className="grid grid-cols-6 gap-1">
            <button
               onClick={() => setSelectedYear('all')}
               className={`py-2 rounded-xl text-[10px] font-black transition-all ${
                 selectedYear === 'all' 
                   ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' 
                   : 'bg-brand-800/60 text-brand-400 hover:bg-brand-700'
               }`}
            >
              ALL
            </button>
            {/* Dynamic year list from data, sorted descending */}
            {[...new Set(data.flatMap(d => d.tahunList || []))].sort((a, b) => b - a).map(y => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`py-2 rounded-xl text-[10px] font-black transition-all ${
                  selectedYear === y 
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' 
                    : 'bg-brand-800/60 text-brand-400 hover:bg-brand-700'
                }`}
              >
                {y.toString().slice(2)}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-grow p-5 space-y-1 overflow-y-auto">
          <p className="text-[9px] text-brand-500 font-black uppercase tracking-widest mb-3 px-2">🗂️ Menu</p>
          {NAV_ITEMS.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all duration-200 group ${
                  isActive 
                    ? 'bg-brand-500 text-white shadow-xl shadow-brand-500/25' 
                    : 'text-brand-300 hover:bg-brand-800 hover:text-white'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${isActive ? 'bg-white/20' : 'bg-brand-800/60 group-hover:bg-brand-700'}`}>
                  <item.icon size={18} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-black leading-none">{item.label}</p>
                  <p className="text-[9px] opacity-60 font-bold mt-0.5 leading-none">{item.desc}</p>
                </div>
                {isActive && <ChevronRight size={14} className="ml-auto" />}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-5 border-t border-brand-800/60">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Supabase Connected</p>
          </div>
          <p className="text-[9px] text-brand-600 font-bold">
            {activeYearData.length} Wilayah • {Math.max(...(data.flatMap(d => d.tahunList) || [2025]))} Ready
          </p>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-grow min-h-screen">
        
        {/* ===== TOP HEADER ===== */}
        <header className="bg-black/40 border-b border-white/5 sticky top-0 z-20 backdrop-blur-xl">
          <div className="px-5 md:px-8 py-4 flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-grow">
              <h2 className="font-black text-lg md:text-xl text-white uppercase tracking-tight flex items-center gap-2">
                {NAV_ITEMS.find(n => n.id === activeTab)?.label || 'Dashboard'}
              </h2>
              <p className="text-slate-400 text-xs font-bold mt-0.5 flex items-center gap-2">
                <span>Data PAD Wilayah Jawa</span>
                <span className="px-2 py-0.5 bg-brand-500/10 text-brand-400 rounded-full font-black text-[10px]">
                  {selectedYear === 'all' ? 'Semua Periode' : `Tahun ${selectedYear}`}
                </span>
                <span className="px-2 py-0.5 bg-white/5 text-slate-400 rounded-full font-black text-[10px]">
                  {activeSubMetric !== 'all' 
                    ? (Array.isArray(activeSubMetric) ? `${activeSubMetric.length} Komponen` : categories.find(c => c.kode === activeSubMetric)?.nama)
                    : (METRICS.find(m => m.id === activeMetric)?.label || 'PAD Total')}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Province Global Filter (Hidden on Dashboard because we have a better UI there) */}
              <div className={`relative hidden ${activeTab === 'dashboard' ? 'lg:hidden' : 'lg:block'}`}>
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <select 
                  value={globalProvFilter}
                  onChange={(e) => setGlobalProvFilter(e.target.value)}
                  className="pl-9 pr-8 py-2.5 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 focus:ring-2 focus:ring-brand-500 w-48 text-[11px] font-black uppercase tracking-widest outline-none appearance-none transition-all text-white cursor-pointer"
                >
                  <option value="all" className="bg-slate-900 border-none">Semua Provinsi</option>
                  {Object.keys(PROVINCE_KABKOTA).sort().map(p => (
                    <option key={p} value={p} className="bg-slate-900 border-none">{p.replace('Prov. ', '')}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={12} />
              </div>

              {/* Metric Global Filter (Hidden on Dashboard) */}
              <div className={`relative ${activeTab === 'dashboard' ? 'hidden' : 'block'}`}>
                <BarChart3 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <select 
                  value={activeMetric}
                  onChange={(e) => {
                    setActiveMetric(e.target.value);
                    const sorted = [...activeYearData].sort((a, b) => b[e.target.value] - a[e.target.value]);
                    if (sorted.length > 0) setActiveInsight(sorted[0]);
                  }}
                  className="pl-9 pr-8 py-2.5 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 focus:ring-2 focus:ring-brand-500 min-w-44 text-[11px] font-black uppercase tracking-widest outline-none appearance-none transition-all text-white cursor-pointer"
                >
                  {METRICS.map(m => (
                    <option key={m.id} value={m.id} className="bg-slate-900 border-none">{m.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={12} />
              </div>

              {/* Header Province & Kab/Kota Filter (Drilldown) */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <select 
                    value={globalProvFilter}
                    onChange={(e) => {
                      setGlobalProvFilter(e.target.value);
                      setGlobalKabKotaFilter('all'); // Reset Kab/Kota on Province change
                    }}
                    className="pl-9 pr-8 py-2.5 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 focus:ring-2 focus:ring-brand-500 min-w-[160px] text-[11px] font-black uppercase tracking-widest outline-none appearance-none transition-all text-white cursor-pointer"
                  >
                    <option value="all" className="bg-slate-900 border-none">Semua Provinsi</option>
                    {Object.keys(PROVINCE_KABKOTA).sort().map(p => (
                      <option key={p} value={p} className="bg-slate-900 border-none">{p.replace('Prov. ', '')}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={12} />
                </div>

                <AnimatePresence>
                  {globalProvFilter !== 'all' && (
                    <motion.div
                      initial={{ opacity: 0, x: -10, width: 0 }}
                      animate={{ opacity: 1, x: 0, width: 'auto' }}
                      exit={{ opacity: 0, x: -10, width: 0 }}
                      className="flex items-center gap-2 overflow-hidden"
                    >
                      <div className="text-slate-700">
                        <ChevronRight size={14} />
                      </div>
                      <div className="relative">
                        <Map className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" size={15} />
                        <select 
                          value={globalKabKotaFilter}
                          onChange={(e) => setGlobalKabKotaFilter(e.target.value)}
                          className="pl-9 pr-8 py-2.5 bg-brand-500/10 rounded-xl border border-brand-500/20 hover:border-brand-500/40 focus:ring-2 focus:ring-brand-500 min-w-[180px] text-[11px] font-black uppercase tracking-widest outline-none appearance-none transition-all text-brand-400 cursor-pointer"
                        >
                          <option value="all" className="bg-slate-900 border-none">Semua Kab/Kota</option>
                          {(PROVINCE_KABKOTA[globalProvFilter] || []).map(k => (
                            <option key={k} value={k} className="bg-slate-900 border-none">{k.replace('Kab. ', '').replace('Kota ', '')}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-500/60 pointer-events-none" size={12} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Search */}
              {activeTab === 'dashboard' && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input 
                    type="text" 
                    placeholder="Cari wilayah..." 
                    className="pl-10 pr-4 py-2.5 bg-white/5 rounded-xl border border-white/10 focus:ring-2 focus:ring-brand-500 w-52 text-sm outline-none transition-all text-white placeholder:text-white/20"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                      <X size={14} />
                    </button>
                  )}
                </div>
              )}

              {/* Refresh */}
              <button onClick={fetchData} className="p-2.5 bg-white/5 rounded-xl text-slate-400 hover:text-brand-400 hover:bg-white/10 transition-all border border-white/10" title="Refresh Data">
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8">
          
          {/* ==================== DASHBOARD TAB ==================== */}
          {activeTab === 'dashboard' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

              {/* ===== INTEGRATED DASHBOARD FILTER SYSTEM ===== */}
              <div className="relative z-[100]">
                {/* Celebration Overlay Effect */}
                <AnimatePresence>
                  {showCelebrate && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-[-1] pointer-events-none"
                    >
                      <div className="absolute inset-0 bg-brand-500/10 blur-[80px] rounded-full animate-pulse" />
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full px-6 py-2 bg-brand-500 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(59,130,246,0.5)] flex items-center gap-3">
                        <Sparkles size={14} className="text-yellow-300" /> Analisis Data Diperbarui
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    boxShadow: showCelebrate ? '0 0 80px -10px rgba(59,130,246,0.4)' : '0 25px 50px -12px rgba(0,0,0,0.5)'
                  }}
                  className={`bg-white/5 backdrop-blur-xl rounded-[32px] p-2 border transition-all duration-700 ${showCelebrate ? 'border-brand-500/50' : 'border-white/10'} relative`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-2">
                    {/* Main Categories Row - Fixed for no overlap */}
                    <div className="flex flex-wrap lg:flex-nowrap lg:flex-grow gap-1 p-1">
                      {METRICS.map(m => {
                        const isActive = activeMetric === m.id;
                        const isSubSelected = Array.isArray(activeSubMetric) && activeSubMetric.length > 0 && 
                                           (m.id === 'rataRataPajak' && dashActiveGroup === 'PAJAK' || 
                                            m.id === 'rataRataRetribusi' && dashActiveGroup === 'RETRIBUSI' ||
                                            m.id === 'rataRataPengelolaan' && dashActiveGroup === 'PENGELOLAAN' ||
                                            m.id === 'rataRataLain' && dashActiveGroup === 'LAIN-LAIN');
                                            
                        return (
                          <button
                            key={m.id}
                            onClick={() => {
                              setActiveMetric(m.id);
                              if (m.id === 'rataRataPAD') {
                                setActiveSubMetric('all');
                                setIsDashFilterOpen(false);
                              } else {
                                const groupMap = {
                                  'rataRataPajak': 'PAJAK',
                                  'rataRataRetribusi': 'RETRIBUSI',
                                  'rataRataPengelolaan': 'PENGELOLAAN',
                                  'rataRataLain': 'LAIN-LAIN'
                                };
                                setDashActiveGroup(groupMap[m.id]);
                                setIsDashFilterOpen(true);
                              }
                            }}
                            className={`flex items-center gap-2 px-3 py-3 lg:px-5 lg:py-4 rounded-2xl transition-all relative overflow-hidden group flex-grow lg:flex-initial min-w-[120px] ${
                              isActive ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'bg-white/5 text-slate-400 hover:bg-white/10'
                            }`}
                          >
                            <m.icon size={18} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-brand-400'} />
                            <div className="text-left">
                              <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-70">
                                {m.label.split(' ')[1] || 'Total'}
                              </p>
                              <p className="text-xs font-black uppercase tracking-tighter truncate max-w-[100px]">
                                {m.label.split(' ')[0]}
                              </p>
                            </div>
                            {isSubSelected && !isActive && (
                              <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="h-10 w-px bg-white/10 hidden lg:block mx-2" />

                    {/* Advanced Search/Toggle */}
                    <div className="px-4 py-2 flex items-center gap-3">
                      <button 
                         onClick={() => setIsDashFilterOpen(!isDashFilterOpen)}
                         className={`p-4 rounded-2xl border transition-all ${
                           isDashFilterOpen ? 'bg-brand-500 border-brand-400 text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                         }`}
                         title="Toggle Advanced Filter"
                      >
                        <Filter size={18} />
                      </button>
                      <div className="relative flex-grow lg:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input 
                          type="text"
                          placeholder="Cari rincian..."
                          value={dashSearchQuery}
                          onChange={(e) => {
                            setDashSearchQuery(e.target.value);
                            if (e.target.value !== '') setIsDashFilterOpen(true);
                          }}
                          className="w-full pl-12 pr-4 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500/50 transition-all placeholder:text-slate-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ===== ACTIVE SELECTION CHIPS (The "Keren" Part) ===== */}
                  <AnimatePresence>
                    {activeSubMetric !== 'all' && Array.isArray(activeSubMetric) && activeSubMetric.length > 0 && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-6 pb-4 -mt-2 overflow-hidden"
                      >
                        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-white/5">
                          <div className="flex items-center gap-2 mr-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Aktif Analisis:</span>
                          </div>
                          
                          {activeSubMetric.map(code => {
                            const cat = categories.find(c => c.kode === code);
                            return (
                              <motion.div 
                                layout
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                key={code}
                                className="px-3 py-1.5 bg-brand-500/10 border border-brand-500/20 rounded-full flex items-center gap-2 group hover:bg-brand-500/20 transition-all cursor-default"
                              >
                                <span className="text-[9px] font-black text-brand-400 uppercase tracking-tight">{cat?.nama || code}</span>
                                <button 
                                  onClick={() => {
                                    const next = activeSubMetric.filter(c => c !== code);
                                    setActiveSubMetric(next.length > 0 ? next : 'all');
                                  }}
                                  className="text-brand-500/40 hover:text-brand-400 transition-colors"
                                >
                                  <X size={10} />
                                </button>
                              </motion.div>
                            );
                          })}
                          
                          <button 
                            onClick={() => setActiveSubMetric('all')}
                            className="text-[9px] font-black text-slate-600 hover:text-white uppercase transition-colors px-2"
                          >
                            Reset Semua
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ===== FLOATING ADVANCED LIST (Overlay - No Layout Shift) ===== */}
                  <AnimatePresence>
                    {isDashFilterOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.98 }}
                        className="absolute top-[calc(100%+1rem)] left-0 right-0 z-[110] bg-[#0f172a] rounded-[48px] border border-white/10 shadow-[0_48px_96px_-24px_rgba(0,0,0,0.9)] overflow-hidden ring-1 ring-white/5 backdrop-blur-3xl"
                      >
                        <div className="p-8 md:p-12 flex flex-col lg:flex-row gap-12">
                          {/* Left Panel: Context */}
                          <div className="lg:w-80 space-y-8 shrink-0">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <span className="px-2 py-0.5 bg-brand-500/10 text-brand-400 rounded-md text-[10px] font-black uppercase tracking-widest">Advanced Filter</span>
                                <h4 className="text-white font-black text-sm uppercase tracking-tight">{dashActiveGroup}</h4>
                              </div>
                              <p className="text-slate-500 text-[11px] leading-relaxed uppercase font-bold tracking-wider">
                                Pilih satu atau lebih komponen "{dashActiveGroup}" untuk dikombinasikan dalam satu visualisasi.
                              </p>
                            </div>

                            <div className="space-y-3">
                              <button 
                                onClick={() => {
                                  setActiveSubMetric(Array.from(tempDashSelected));
                                  setIsDashFilterOpen(false);
                                  triggerCelebration();
                                }}
                                disabled={isSubLoading}
                                className={`w-full py-4.5 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-brand-500/30 active:scale-95 flex items-center justify-center gap-3 ${isSubLoading ? 'opacity-50 cursor-wait' : ''}`}
                              >
                                {isSubLoading ? (
                                  <>Memproses... <RefreshCw size={16} className="animate-spin" /></>
                                ) : (
                                  <>Terapkan Filter <ArrowUpRight size={16} /></>
                                )}
                              </button>
                               <button 
                                onClick={() => {
                                  setTempDashSelected(new Set());
                                  setActiveSubMetric('all');
                                }}
                                className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-slate-500 rounded-2xl text-[10px] font-black uppercase transition-all border border-white/5"
                              >
                                Bersihkan Pilihan
                              </button>
                            </div>

                            <div className="bg-brand-500/5 rounded-3xl p-6 border border-brand-500/10">
                              <h5 className="text-[10px] font-black text-brand-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                                <Sparkles size={14} /> Power Tip
                              </h5>
                              <p className="text-[9px] text-slate-400 font-bold leading-relaxed uppercase tracking-wide">
                                Data pada ringkasan, grafik, dan peta akan otomatis mengakumulasi semua komponen yang Anda pilih.
                              </p>
                            </div>
                          </div>

                          {/* Right Panel: Checkboxes Grid */}
                          <div className="flex-grow">
                            <div className="flex items-center justify-between mb-6 px-2">
                              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Daftar Rincian ({filteredCategories.length})</h4>
                              <div className="flex gap-4">
                                <button 
                                  onClick={() => {
                                    const next = new Set(tempDashSelected);
                                    filteredCategories.forEach(c => next.add(c.kode));
                                    setTempDashSelected(next);
                                  }}
                                  className="text-[10px] font-black text-brand-400 uppercase tracking-widest hover:text-white transition-colors"
                                >
                                  Pilih Semua
                                </button>
                                <button 
                                  onClick={() => {
                                    const next = new Set(tempDashSelected);
                                    filteredCategories.forEach(c => next.delete(c.kode));
                                    setTempDashSelected(next);
                                  }}
                                  className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
                                >
                                  Deselect
                                </button>
                              </div>
                            </div>

                            <div className="max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {filteredCategories
                                  .filter(c => dashSearchQuery === '' || c.nama.toLowerCase().includes(dashSearchQuery.toLowerCase()))
                                  .map(cat => (
                                    <label 
                                      key={cat.kode} 
                                      className={`flex items-start gap-4 p-4 rounded-[24px] border cursor-pointer transition-all group ${
                                        tempDashSelected.has(cat.kode) 
                                          ? 'bg-brand-500/20 border-brand-500/30 ring-1 ring-brand-500/20' 
                                          : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                                      }`}
                                    >
                                      <input 
                                        type="checkbox"
                                        checked={tempDashSelected.has(cat.kode)}
                                        onChange={() => {
                                          const next = new Set(tempDashSelected);
                                          if (next.has(cat.kode)) next.delete(cat.kode);
                                          else next.add(cat.kode);
                                          setTempDashSelected(next);
                                        }}
                                        className="hidden"
                                      />
                                      <div className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all shrink-0 ${
                                        tempDashSelected.has(cat.kode) ? 'bg-brand-500 border-brand-500' : 'border-slate-800 bg-slate-900 group-hover:border-slate-600'
                                      }`}>
                                        {tempDashSelected.has(cat.kode) && <X size={14} className="text-white rotate-45" />}
                                      </div>
                                      <div className="flex-grow -mt-0.5">
                                        <p className={`text-[11px] font-black uppercase tracking-tight leading-snug transition-colors ${
                                          tempDashSelected.has(cat.kode) ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                                        }`}>
                                          {cat.nama}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-1 opacity-50">
                                          <Database size={8} className="text-slate-500" />
                                          <span className="text-[9px] text-slate-500 font-mono tracking-tighter">{cat.kode}</span>
                                        </div>
                                      </div>
                                    </label>
                                  ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total PAD" value={formatCurrencyShort(stats.totalRealisasi)} icon={TrendingUp} description={selectedYear === 'all' ? 'Akumulasi Semua Tahun' : `Realisasi ${selectedYear}`} color="brand" />
                <StatCard title="Total Pajak" value={formatCurrencyShort(stats.totalPajak)} icon={BarChart3} description={selectedYear === 'all' ? 'Total Pajak Terkumpul' : 'Kontribusi pajak'} color="indigo" />
                <StatCard
                  title="% Capaian"
                  value={`${((stats.totalRealisasi / (stats.totalAnggaran || 1)) * 100).toFixed(1)}%`}
                  icon={Award}
                  description={selectedYear === 'all' ? 'Rata-rata Capaian' : `Target: ${formatCurrencyShort(stats.totalAnggaran)}`}
                  color="emerald"
                />
                <StatCard title="Wilayah" value={stats.totalDaerah} icon={Building2} description="Kab/Kota Pulau Jawa" color="amber" />
              </div>

              {/* SEARCH RESULTS or NORMAL CONTENT */}
              {searchQuery !== '' ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-1.5 bg-brand-400 rounded-full" />
                    <h3 className="text-xl font-black text-white">
                      {filteredData.length} hasil untuk "<span className="text-brand-400">{searchQuery}</span>"
                    </h3>
                    <button onClick={() => setSearchQuery('')} className="ml-auto text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
                      <X size={12} /> Hapus pencarian
                    </button>
                  </div>
                  {filteredData.length === 0 ? (
                    <div className="bg-white/5 rounded-3xl p-16 text-center border border-white/5">
                      <Search size={48} className="mx-auto text-slate-700 mb-4" />
                      <p className="text-slate-500 font-bold">Tidak ada wilayah yang cocok.</p>
                    </div>
                  ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {filteredData.map((region, idx) => (
                            <RegionCard 
                              key={region.id} 
                              region={region} 
                              rank={idx + 1} 
                              value={region[activeMetric]} 
                              label={`${selectedYear === 'all' ? 'Total' : `TA ${selectedYear}`} • ${activeSubMetric !== 'all' ? (categories.find(c => c.id === activeSubMetric)?.nama || 'Rincian') : (METRICS.find(m => m.id === activeMetric)?.label || 'PAD')}`} 
                              onClick={() => setSelectedRegion(region)} 
                            />
                          ))}
                        </div>
                  )}
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Executive Insight Banner */}
                  <motion.div key={activeMetric} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-slate-900 via-brand-950 to-indigo-950 rounded-3xl p-6 md:p-8 relative overflow-hidden ring-1 ring-white/5"
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                      <Sparkles size={200} className="text-white rotate-12" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
                      <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="bg-amber-400/20 p-1.5 rounded-lg">
                            <Lightbulb size={18} className="text-amber-300" />
                          </div>
                          <span className="text-[9px] font-black text-brand-400 uppercase tracking-[0.3em]">Executive Insight</span>
                        </div>
                        <h3 className="text-white font-black text-xl md:text-2xl uppercase tracking-tight mb-1">
                          {activeInsight?.daerah}
                        </h3>
                        <p className="text-slate-300 text-sm">
                          Menjadi kontributor tertinggi dengan <span className="text-emerald-400 font-black">
                            {activeInsight?.[activeMetric] >= 1e12 
                              ? `Rp ${(activeInsight[activeMetric] / 1e12).toFixed(2)} Triliun` 
                              : `Rp ${(activeInsight[activeMetric] / 1e9).toFixed(1)} Miliar`}
                          </span> {selectedYear === 'all' 
                            ? `total akumulasi ${activeSubMetric !== 'all' ? categories.find(c => c.kode === activeSubMetric)?.nama : METRICS.find(m => m.id === activeMetric)?.label} (${activeInsight?.tahunList?.length || 0} tahun).` 
                            : `realisasi ${activeSubMetric !== 'all' ? categories.find(c => c.kode === activeSubMetric)?.nama : METRICS.find(m => m.id === activeMetric)?.label} tahun ${selectedYear}.`}
                        </p>
                      </div>
                      <div className="flex-shrink-0 bg-white/5 rounded-2xl p-5 ring-1 ring-white/5 min-w-[200px]">
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Rata-rata Semua Wilayah</p>
                        <p className="text-2xl font-black text-white">
                          {formatCurrencyShort(activeYearData.reduce((s, d) => s + d[activeMetric], 0) / (activeYearData.length || 1))}
                        </p>
                        <button onClick={() => setSelectedRegion(activeInsight)} className="mt-3 text-brand-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:text-white transition-colors">
                          Lihat Detail <ArrowUpRight size={12} />
                        </button>
                      </div>
                    </div>
                  </motion.div>

                  {/* RANKING ANALYTICS GRID (New System) */}
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    {/* Left: Provincial Ranking (30%) */}
                    <div className="xl:col-span-4 h-full">
                      <AnimatePresence mode="wait">
                        {provincialRanking.length > 0 ? (
                          <motion.div 
                            key="prov-ranking"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-white/5 backdrop-blur-3xl rounded-[40px] p-6 border border-white/10 shadow-2xl h-full flex flex-col"
                          >
                            <div className="flex items-center gap-3 mb-6">
                              <div className="p-2 bg-blue-500/20 rounded-xl">
                                <Award size={18} className="text-blue-400" />
                              </div>
                              <h3 
                                className="text-white font-black text-xs uppercase tracking-widest truncate"
                                title={activeSubMetric !== 'all' 
                                  ? `Ranking 6 Provinsi: ${
                                      Array.isArray(activeSubMetric) 
                                        ? (activeSubMetric.length === 1 
                                            ? (categories.find(c => c.kode === activeSubMetric[0])?.nama || activeSubMetric[0])
                                            : `${activeSubMetric.length} Komponen Terpilih`)
                                        : (categories.find(c => c.kode === activeSubMetric)?.nama || activeSubMetric)
                                    }` 
                                  : `Ranking 6 Provinsi: ${METRICS.find(m => m.id === activeMetric)?.label || 'PAD'}`}
                              >
                                {activeSubMetric !== 'all' 
                                  ? `Ranking 6 Provinsi: ${
                                      Array.isArray(activeSubMetric) 
                                        ? (activeSubMetric.length === 1 
                                            ? (categories.find(c => c.kode === activeSubMetric[0])?.nama || activeSubMetric[0])
                                            : `${activeSubMetric.length} Komponen Terpilih`)
                                        : (categories.find(c => c.kode === activeSubMetric)?.nama || activeSubMetric)
                                    }` 
                                  : `Ranking 6 Provinsi: ${METRICS.find(m => m.id === activeMetric)?.label || 'PAD'}`}
                              </h3>
                            </div>

                            <div className="flex-grow min-h-[300px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={provincialRanking} layout="vertical" margin={{ top: 0, right: 60, left: 10, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ffffff" opacity={0.03} />
                                  <XAxis type="number" hide />
                                  <YAxis 
                                    type="category" 
                                    dataKey="displayName" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    width={90}
                                    tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: '900' }}
                                  />
                                  <Tooltip 
                                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: 'none', fontSize: '11px' }}
                                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                    labelStyle={{ color: '#94a3b8', fontWeight: 'black', marginBottom: '4px' }}
                                    formatter={(v) => [formatCurrencyShort(v), 'Realisasi']}
                                  />
                                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24} onClick={p => p?.payload && setActiveInsight(p.payload)}>
                                    {provincialRanking.map((entry, i) => (
                                      <Cell key={i} fill={activeInsight?.daerah === entry.daerah ? '#f59e0b' : '#3b82f6'} className="cursor-pointer" />
                                    ))}
                                    <LabelList 
                                      dataKey="value" 
                                      position="right" 
                                      content={(props) => (
                                        <text 
                                          x={props.x + props.width + 5} 
                                          y={props.y + props.height / 2 + 4} 
                                          fill="#f8fafc" 
                                          fontSize="10" 
                                          fontWeight="900"
                                          className="drop-shadow-sm"
                                        >
                                          {formatCurrencyShort(props.value)}
                                        </text>
                                      )}
                                    />
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div 
                            key="prov-empty"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white/5 backdrop-blur-3xl rounded-[40px] p-6 border border-white/10 shadow-2xl h-full flex flex-col items-center justify-center text-center"
                          >
                            <AlertTriangle size={32} className="text-amber-500 mb-4 opacity-50" />
                            <h3 className="text-white font-black text-xs uppercase tracking-widest mb-2">Data Tidak Tersedia</h3>
                            <p className="text-slate-400 text-[10px] uppercase font-bold leading-relaxed px-4">
                              Kategori ini mungkin tidak tersedia untuk level Provinsi.
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Right: Full Regional Ranking (70%) */}
                    <div className="xl:col-span-8">
                      <AnimatePresence mode="wait">
                        {regionalRanking.length > 0 ? (
                          <motion.div 
                            key="reg-ranking"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="bg-white/5 backdrop-blur-3xl rounded-[40px] p-8 border border-white/10 shadow-2xl relative overflow-hidden h-full flex flex-col"
                          >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/20 rounded-xl">
                                  <BarChart2 size={20} className="text-emerald-400" />
                                </div>
                                <h3 
                                  className="text-white font-black text-sm uppercase tracking-widest truncate max-w-[250px] md:max-w-md"
                                  title={activeSubMetric !== 'all' 
                                    ? `Analisis Performa: ${
                                        Array.isArray(activeSubMetric)
                                          ? (activeSubMetric.length === 1
                                              ? (categories.find(c => c.kode === activeSubMetric[0])?.nama || activeSubMetric[0])
                                              : `${activeSubMetric.length} Komponen Terpilih`)
                                          : (categories.find(c => c.kode === activeSubMetric)?.nama || activeSubMetric)
                                      }`
                                    : `Analisis Performa Kab/Kota`}
                                >
                                  {activeSubMetric !== 'all' 
                                    ? `Analisis Performa: ${
                                        Array.isArray(activeSubMetric)
                                          ? (activeSubMetric.length === 1
                                              ? (categories.find(c => c.kode === activeSubMetric[0])?.nama || activeSubMetric[0])
                                              : `${activeSubMetric.length} Komponen Terpilih`)
                                          : (categories.find(c => c.kode === activeSubMetric)?.nama || activeSubMetric)
                                      }`
                                    : `Analisis Performa Kab/Kota`}
                                </h3>
                              </div>
                              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5">
                                <span className="text-[10px] font-black text-brand-400 uppercase tracking-tight">{regionalRanking.length} Wilayah Aktif</span>
                              </div>
                            </div>

                            <div className="relative h-[400px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent flex-grow">
                              <div style={{ height: Math.max(400, regionalRanking.length * 40) }}>
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart 
                                    data={regionalRanking} 
                                    layout="vertical" 
                                    margin={{ top: 0, right: 80, left: 80, bottom: 0 }}
                                    onClick={(p) => {
                                      if (p?.activePayload?.[0]?.payload) {
                                        setActiveInsight(p.activePayload[0].payload);
                                      }
                                    }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ffffff" opacity={0.03} />
                                    <XAxis type="number" hide />
                                    <YAxis 
                                      type="category" 
                                      dataKey="displayName" 
                                      axisLine={false} 
                                      tickLine={false} 
                                      width={140}
                                      tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: '900' }}
                                    />
                                    <Tooltip 
                                      cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                      contentStyle={{ 
                                        backgroundColor: '#0f172a', 
                                        borderRadius: '16px', 
                                        border: '1px solid rgba(255,255,255,0.1)', 
                                        fontSize: '11px',
                                        padding: '12px'
                                      }}
                                      itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                      labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontWeight: 'black' }}
                                      formatter={(v) => [formatCurrencyShort(v), 'Realisasi']}
                                    />
                                    <Bar 
                                      dataKey="value" 
                                      radius={[0, 6, 6, 0]} 
                                      barSize={20}
                                    >
                                      {regionalRanking.map((entry, i) => (
                                        <Cell 
                                          key={i} 
                                          fill={activeInsight?.daerah === entry.daerah ? '#f59e0b' : '#3949ab'}
                                          className="cursor-pointer hover:opacity-80 transition-opacity"
                                          style={{ filter: activeInsight?.daerah === entry.daerah ? 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.4))' : 'none' }}
                                        />
                                      ))}
                                      <LabelList 
                                        dataKey="value" 
                                        position="right" 
                                        content={(props) => (
                                          <text 
                                            x={props.x + props.width + 5} 
                                            y={props.y + props.height / 2 + 4} 
                                            fill="#f8fafc" 
                                            fontSize="9" 
                                            fontWeight="900"
                                            className="drop-shadow-sm"
                                          >
                                            {formatCurrencyShort(props.value)}
                                          </text>
                                        )}
                                      />
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div 
                            key="reg-empty"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white/5 backdrop-blur-3xl rounded-[40px] p-8 border border-white/10 shadow-2xl h-full flex flex-col items-center justify-center text-center"
                          >
                            <div className="p-4 bg-amber-500/10 rounded-full mb-6">
                              <AlertTriangle size={40} className="text-amber-500 opacity-60" />
                            </div>
                            <h3 className="text-white font-black text-lg uppercase tracking-widest mb-4">Analisis Performa Tidak Tersedia</h3>
                            <p className="text-slate-400 text-sm font-bold leading-relaxed max-w-md mx-auto">
                              Kategori {activeSubMetric !== 'all' ? `"${categories.find(c => c.kode === activeSubMetric)?.nama}"` : ''} merupakan kewenangan khusus level Provinsi. Data untuk Kabupaten/Kota pada sektor ini tidak ditemukan.
                            </p>
                            <button 
                              onClick={() => {
                                setActiveSubMetric('all');
                                setTempSubMetric('all');
                              }}
                              className="mt-8 px-8 py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-widest rounded-full border border-white/10 transition-all"
                            >
                              Reset Filter Pajak
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* CHARTS ROW */}
                  <div className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Bar Chart Top 10 Kab/Kota */}
                      <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl">
                        <h3 
                          className="font-black text-white text-[11px] md:text-xs uppercase tracking-widest flex items-center gap-2 mb-5 truncate"
                          title={activeSubMetric !== 'all' 
                            ? `Top 10 Kab/Kota: ${
                                Array.isArray(activeSubMetric) 
                                  ? (activeSubMetric.length === 1 
                                      ? (categories.find(c => c.kode === activeSubMetric[0])?.nama || activeSubMetric[0]) 
                                      : `${activeSubMetric.length} Komponen`) 
                                  : (categories.find(c => c.kode === activeSubMetric)?.nama || activeSubMetric)
                              }`
                            : `${METRICS.find(m => m.id === activeMetric)?.label}`}
                        >
                          <BarChart3 size={16} className="text-emerald-500 shrink-0" /> 
                          <span className="truncate">
                            Top 10 Kab/Kota: {activeSubMetric !== 'all' 
                              ? (Array.isArray(activeSubMetric) 
                                  ? (activeSubMetric.length === 1 
                                      ? (categories.find(c => c.kode === activeSubMetric[0])?.nama || activeSubMetric[0]) 
                                      : `${activeSubMetric.length} Komponen`) 
                                  : (categories.find(c => c.kode === activeSubMetric)?.nama || activeSubMetric)) 
                              : METRICS.find(m => m.id === activeMetric)?.label} ({selectedYear === 'all' ? 'Semua Periode' : selectedYear})
                          </span>
                        </h3>
                        <div className="h-[280px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={top10KabKota} margin={{ top: 0, right: 0, left: -20, bottom: 40 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" opacity={0.05} />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 8, fontWeight: 'bold' }} angle={-35} textAnchor="end" />
                              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9 }} tickFormatter={v => v >= 1e12 ? `${(v/1e12).toFixed(1)}T` : `${(v/1e9).toFixed(0)}M`} />
                              <Tooltip 
                                cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 8 }} 
                                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '14px', border: 'none', fontSize: '11px' }} 
                                itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                labelStyle={{ color: '#94a3b8', fontWeight: 'black', marginBottom: '4px' }}
                                formatter={v => [formatCurrencyShort(v), 'Realisasi']} 
                              />
                              <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={26} onClick={p => p?.payload && setActiveInsight(p.payload)}>
                                {top10KabKota.map((entry, i) => (
                                  <Cell key={i} fill={activeInsight?.daerah === entry.daerah ? '#f59e0b' : (i < 3 ? '#10b981' : '#3949ab')} className="cursor-pointer" />
                                ))}
                                <LabelList
                                  dataKey="value"
                                  position="top"
                                  content={(props) => (
                                    <text
                                      x={props.x + props.width / 2}
                                      y={props.y - 12}
                                      fill="#cbd5e1"
                                      fontSize="8"
                                      fontWeight="900"
                                      textAnchor="middle"
                                    >
                                      {formatCurrencyShort(props.value)}
                                    </text>
                                  )}
                                />
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Province Distribution */}
                      <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
                        <h3 className="font-black text-white text-sm uppercase tracking-widest flex items-center gap-2 mb-5">
                          <Globe size={16} className="text-brand-500" /> Komposisi & Distribusi Provinsi
                        </h3>
                        <div className="space-y-2">
                          {provinceStats.map((p, i) => (
                            <ProvinceCard
                              key={p.name}
                              name={`${p.name} (${p.count} wilayah)`}
                              value={p.value}
                              budget={p.budget}
                              rank={i + 1}
                              color={p.color}
                              isSelected={selectedProvince === p.name}
                              onClick={() => setSelectedProvince(selectedProvince === p.name ? null : p.name)}
                            />
                          ))}
                        </div>

                        {/* Province Drill-Down: Kab/Kota list */}
                        <AnimatePresence>
                          {selectedProvince && provinceKabKotaData.length > 0 && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: 'easeInOut' }}
                              className="overflow-hidden"
                            >
                              <div className="mt-4 pt-4 border-t border-white/10 space-y-6">
                                {/* Province Category Breakdown */}
                                {(() => {
                                  const prov = provinceStats.find(p => p.name === selectedProvince);
                                  if (!prov) return null;
                                  return (
                                    <div className="grid grid-cols-2 gap-2">
                                      {[
                                        { l: 'Pajak', v: prov.breakdown.pajak, a: prov.breakdown.pajakAng, c: 'text-indigo-400' },
                                        { l: 'Retribusi', v: prov.breakdown.retribusi, a: prov.breakdown.retribusiAng, c: 'text-emerald-400' },
                                        { l: 'Pengelolaan', v: prov.breakdown.pengelolaan, a: prov.breakdown.pengelolaanAng, c: 'text-blue-400' },
                                        { l: 'Lain-lain', v: prov.breakdown.lain, a: prov.breakdown.lainAng, c: 'text-amber-400' },
                                      ].map(cat => (
                                        <div key={cat.l} className="bg-white/5 p-3 rounded-2xl border border-white/5">
                                          <p className="text-[9px] font-black text-slate-500 uppercase mb-1">{cat.l}</p>
                                          <p className={`text-xs font-black ${cat.c}`}>{formatCurrencyShort(cat.v)}</p>
                                          <div className="flex items-center justify-between mt-1 text-[8px] font-bold">
                                            <span className="text-slate-500">Target: {formatCurrencyShort(cat.a)}</span>
                                            <span className="text-slate-300">{cat.a > 0 ? ((cat.v/cat.a)*100).toFixed(0) : 0}%</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  );
                                })()}

                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-black text-brand-400 uppercase tracking-widest flex items-center gap-2">
                                    <Building2 size={14} />
                                    Kab/Kota di {selectedProvince}
                                  </h4>
                                  <span className="text-[10px] text-slate-500 font-bold">
                                    {provinceKabKotaData.length} wilayah
                                  </span>
                                </div>
                                <div className="space-y-1 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                                  {provinceKabKotaData.map((region, idx) => (
                                    <div
                                      key={region.id || region.daerah}
                                      onClick={() => setSelectedRegion(region)}
                                      className="flex items-center gap-2.5 p-2.5 bg-white/5 rounded-lg hover:bg-white/10 transition-all cursor-pointer group border border-white/5"
                                    >
                                      <span className="text-[10px] font-black text-slate-600 w-5 text-center">{idx + 1}</span>
                                      <div className="flex-grow min-w-0">
                                        <p className="text-[11px] font-bold text-slate-300 group-hover:text-brand-400 transition-colors truncate">
                                          {region.daerah}
                                        </p>
                                      </div>
                                      <span className="text-[11px] font-black text-white whitespace-nowrap">
                                        {formatCurrencyShort(region[activeMetric])}
                                      </span>
                                      <ChevronRight size={10} className="text-slate-600 group-hover:text-brand-400 shrink-0" />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                  

                  {/* SPECIFIC SUB-METRIC GRAPHIC */}
                  {activeSubMetric !== 'all' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-10 border border-brand-500/20 shadow-2xl relative overflow-hidden group"
                    >
                      <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:rotate-45 transition-transform duration-700 pointer-events-none">
                        <BarChart2 size={240} className="text-brand-400" />
                      </div>
                      
                      <div className="relative z-10">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                          <div>
                            <div className="flex items-center gap-3 mb-4">
                              <div className="bg-brand-500 p-2.5 rounded-2xl shadow-lg shadow-brand-500/30">
                                <TrendingUp size={20} className="text-white" />
                              </div>
                              <span className="text-xs font-black text-brand-400 uppercase tracking-widest">Detail Visualisasi Rincian</span>
                            </div>
                            <h3 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                              {categories.find(c => c.kode === activeSubMetric)?.nama}
                            </h3>
                            <p className="text-slate-400 mt-2 text-sm max-w-xl">
                              Berikut adalah persebaran realisasi rincian {activeMetric === 'rataRataPajak' ? 'pajak' : 'pad'} untuk 20 wilayah dengan performa tertinggi di Pulau Jawa.
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-4 bg-white/5 px-6 py-4 rounded-[2rem] border border-white/5">
                            <div className="text-right">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Realisasi</p>
                              <p className="text-xl font-black text-white">
                                {formatCurrencyShort(Object.values(regionalSubData).reduce((acc, d) => acc + (d.realisasi || 0), 0))}
                              </p>
                            </div>
                            <div className="w-px h-10 bg-white/10" />
                            <div className="bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
                              <span className="text-[10px] font-black text-emerald-400">DETAIL</span>
                            </div>
                          </div>
                        </div>

                        <div className="h-[400px] w-full bg-slate-900/40 rounded-[2rem] p-6 border border-white/5 shadow-inner">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                              data={activeYearData
                                .sort((a, b) => b[activeMetric] - a[activeMetric])
                                .slice(0, 20)
                                .map(d => ({
                                  name: d.daerah.replace('Kab. ', '').replace('Kota ', '').replace('Prov. ', ''),
                                  value: d[activeMetric]
                                }))
                              } 
                              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                            >
                              <defs>
                                <linearGradient id="detailBarGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#8b5cf6" />
                                  <stop offset="100%" stopColor="#3b82f6" />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff" opacity={0.03} />
                              <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: '900' }} 
                                angle={-35} 
                                textAnchor="end"
                                interval={0}
                              />
                              <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#64748b', fontSize: 11, fontWeight: '700' }} 
                                tickFormatter={v => formatCurrencyShort(v).replace('Rp ', '')}
                              />
                              <Tooltip 
                                cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 16 }}
                                contentStyle={{ 
                                  backgroundColor: '#0f172a', 
                                  borderRadius: '24px', 
                                  border: '1px solid rgba(255,255,255,0.1)', 
                                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                                  padding: '16px'
                                }}
                                itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                formatter={(val) => [formatCurrencyShort(val), 'Realisasi']}
                                labelStyle={{ color: '#94a3b8', fontWeight: 'bold', marginBottom: '8px' }}
                              />
                              <Bar 
                                dataKey="value" 
                                radius={[12, 12, 4, 4]} 
                                barSize={40}
                                fill="url(#detailBarGradient)"
                                animationDuration={1500}
                              >
                                {top10KabKota.map((entry, index) => (
                                  <Cell 
                                    key={index} 
                                    className="hover:opacity-80 transition-opacity cursor-pointer"
                                    fill={index === 0 ? '#fbbf24' : 'url(#detailBarGradient)'}
                                  />
                                ))}
                                <LabelList
                                  dataKey="value"
                                  position="top"
                                  content={(props) => (
                                    <text
                                      x={props.x + props.width / 2}
                                      y={props.y - 12}
                                      fill="#cbd5e1"
                                      fontSize="10"
                                      fontWeight="bold"
                                      textAnchor="middle"
                                    >
                                      {formatCurrencyShort(props.value)}
                                    </text>
                                  )}
                                />
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* COLLAPSIBLE DATA SECTIONS */}
                  <div className="space-y-3">
                    <h3 className="font-black text-white text-sm uppercase tracking-widest flex items-center gap-2">
                      <Building2 size={16} className="text-brand-500" /> Daftar Wilayah
                      <span className="text-slate-400 font-bold text-xs normal-case tracking-normal ml-1">({filteredData.length} wilayah)</span>
                    </h3>
                    <CollapsibleSection
                      title={
                        activeMetric === 'rataRataPAD' ? 'Pendapatan Asli Daerah (PAD)' :
                        activeMetric === 'rataRataPajak' ? 'Pajak Daerah' :
                        activeMetric === 'rataRataRetribusi' ? 'Retribusi Daerah' :
                        activeMetric === 'rataRataPengelolaan' ? 'Hasil Pengelolaan Kekayaan' : 'Lain-lain PAD'
                      }
                      data={filteredData}
                      metricKey={activeMetric}
                      label={selectedYear === 'all' ? null : `Tahun ${selectedYear}`}
                      color={activeMetric === 'rataRataPAD' ? 'brand' : activeMetric === 'rataRataPajak' ? 'indigo' : activeMetric === 'rataRataRetribusi' ? 'emerald' : activeMetric === 'rataRataPengelolaan' ? 'blue' : 'amber'}
                      onRegionClick={setSelectedRegion}
                      icon={activeMetric === 'rataRataPAD' ? LayoutDashboard : activeMetric === 'rataRataPajak' ? TrendingUp : BarChart3}
                    />
                  </div>
                  {/* DASHBOARD CHARTS ROW */}
                  <div className="space-y-6">
                    {/* ... existing charts ... */}
                  </div>

                  {data.length === 0 && (
                    <div className="bg-white rounded-3xl p-20 text-center ring-2 ring-dashed ring-slate-200">
                      <Database size={56} className="mx-auto text-slate-200 mb-6" />
                      <p className="text-slate-500 font-bold">Database masih kosong.</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'peta-data' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <PetaData 
                allData={activeYearData.filter(d => d.tipe !== 'Provinsi' || d.daerah === 'DKI Jakarta')} 
                selectedYear={selectedYear} 
                activeMetric={activeMetric} 
                subDataLookup={regionalSubData} 
                onDetailClick={setSelectedRegion}
              />
            </motion.div>
          )}

          {/* ==================== DATA MASTER TAB ==================== */}
          {activeTab === 'data-master' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <DataMaster 
                allData={data.filter(d => d.tipe !== 'Provinsi')} 
                onRegionClick={setSelectedRegion} 
                activeMetric={activeMetric} 
                subDataLookup={regionalSubData} 
                metricLabel={activeSubMetric !== 'all' ? categories.find(c => c.kode === activeSubMetric)?.nama : METRICS.find(m => m.id === activeMetric)?.label}
              />
            </motion.div>
          )}

          {/* ==================== CHARTS TAB ==================== */}
          {activeTab === 'charts' && (
            <Visualisasi
              data={data}
              chartDataProvinces={top10Prov}
              chartDataKabKota={top10KabKota}
              activeInsight={activeInsight}
              setActiveInsight={setActiveInsight}
              aiAnalysisData={aiAnalysisData}
              getProvinceName={getProvinceName}
              selectedYear={selectedYear}
              activeMetric={activeMetric}
              activeSubMetric={activeSubMetric}
              metricLabel={activeSubMetric !== 'all' ? categories.find(c => c.kode === activeSubMetric)?.nama : METRICS.find(m => m.id === activeMetric)?.label}
            />
          )}
        </div>
      </main>

      {/* ===== DETAIL MODAL ===== */}
      <AnimatePresence>
        {selectedRegion && (
          <DetailModal region={selectedRegion} onClose={() => setSelectedRegion(null)} selectedYear={selectedYear} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;

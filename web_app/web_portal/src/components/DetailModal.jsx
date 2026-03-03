import React from 'react';
import { 
  X, 
  TrendingUp, 
  BarChart3, 
  Calendar,
  ArrowUpRight,
  ChevronRight,
  ChevronDown,
  Info,
  List,
  LayoutGrid,
  Database,
  Target,
  Award,
  AlertTriangle,
  Search,
  RefreshCw,
  Download,
  Maximize2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { fetchDetailData, fetchKategoriPad } from '../lib/supabase';

const formatCurrency = (val) => {
  if (!val || val === 0) return 'Rp 0';
  if (val >= 1000000000000) return `Rp ${(val / 1000000000000).toFixed(2)} T`;
  if (val >= 1000000000) return `Rp ${(val / 1000000000).toFixed(1)} M`;
  return `Rp ${(val / 1000000).toFixed(0)} Jt`;
};

const formatCurrencyFull = (val) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
};

const KATEGORI_COLORS = {
  pajak: { bg: 'bg-indigo-500', text: 'text-indigo-600', light: 'bg-indigo-50', hex: '#6366f1' },
  retribusi: { bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50', hex: '#10b981' },
  pengelolaan: { bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50', hex: '#3b82f6' },
  lain: { bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50', hex: '#f59e0b' },
};

const DetailModal = ({ region, onClose, selectedYear = 2025 }) => {
  // Determine initial year: if 'all', pick the latest available year for detailed fetching
  const latestYear = region && region.tahunList ? Math.max(...region.tahunList) : 2025;
  const initialYear = selectedYear === 'all' ? latestYear : selectedYear;

  const [details, setDetails] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [viewMode, setViewMode] = React.useState('hierarchy');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [expandedNodes, setExpandedNodes] = React.useState({});
  const [activeYearTab, setActiveYearTab] = React.useState(initialYear);
  const [activeDetailTab, setActiveDetailTab] = React.useState('overview');
  const [filteredSummary, setFilteredSummary] = React.useState(null);
  const [isAllMode, setIsAllMode] = React.useState(selectedYear === 'all');
  
  // NEW: Component selection states
  const [selectedCodes, setSelectedCodes] = React.useState(null); // null = all
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [tempSelectedCodes, setTempSelectedCodes] = React.useState(new Set());

  const loadDetails = React.useCallback(async (year, regionName) => {
    setLoading(true);
    try {
      // Fetch both detail data AND reference categories in parallel
      const [fetchedData, categories] = await Promise.all([
        fetchDetailData(year, regionName),
        fetchKategoriPad()
      ]);

      // Determine region type for filtering
      const isDKI = region?.daerah?.toUpperCase().includes('JAKARTA');
      const isProv = region?.tipe === 'Provinsi' || isDKI;
      const isKabKota = !isProv;

      // 1. Filter ALL categories to only those relevant to this region type
      const relevantCategories = categories.filter(cat => {
        const tingkat = cat.tingkat_pemerintahan;
        if (tingkat === 'semua' || !tingkat) return true;
        if (isDKI) return true;
        if (isProv && tingkat === 'provinsi') return true;
        if (isKabKota && tingkat === 'kabupaten_kota') return true;
        return false;
      });

      // Build reference maps for sorting and building the tree
      const refMap = {};
      relevantCategories.forEach(cat => { refMap[cat.kode] = cat; });

      // 2. Aggregate actual data by kategori_kode
      const dataMap = {};
      (fetchedData || []).forEach(d => {
        const code = d.kategori_kode;
        if (!code) return;
        if (!dataMap[code]) {
          dataMap[code] = { anggaran: 0, realisasi: 0 };
        }
        dataMap[code].anggaran += Number(d.anggaran || 0);
        dataMap[code].realisasi += Number(d.realisasi || 0);
      });

      // 3. Create the merged list: Every relevant category gets a row
      // This is "Category-First" approach: Structure is determined by ref_kategori_pad
      const mergedData = relevantCategories.map(cat => {
        const d = dataMap[cat.kode] || { anggaran: 0, realisasi: 0 };
        return {
          kategori_kode: cat.kode,
          anggaran: d.anggaran,
          realisasi: d.realisasi,
          ref_kategori_pad: { 
            nama: cat.nama, 
            kategori_utama: cat.kategori_utama, 
            sub_kategori: cat.sub_kategori 
          },
          _refLevel: cat.level,
          _refParent: cat.parent_kode,
          _refTingkat: cat.tingkat_pemerintahan,
          _synthetic: !dataMap[cat.kode] // mark as synthetic if not in DB
        };
      });

      // 4. Sort by ref hierarchy (Path-based sort using urutan)
      mergedData.sort((a, b) => {
        const getPath = (kode) => {
          const path = [];
          let current = kode;
          while (current && refMap[current]) {
            path.unshift({ urutan: refMap[current].urutan || 0, kode: current });
            current = refMap[current].parent_kode;
          }
          return path;
        };
        
        const pathA = getPath(a.kategori_kode);
        const pathB = getPath(b.kategori_kode);
        
        for (let i = 0; i < Math.max(pathA.length, pathB.length); i++) {
          const pA = pathA[i];
          const pB = pathB[i];
          if (!pA) return -1;
          if (!pB) return 1;
          if (pA.urutan !== pB.urutan) return pA.urutan - pB.urutan;
          if (pA.kode !== pB.kode) return pA.kode < pB.kode ? -1 : 1;
        }
        return 0;
      });

      // 5. Bottom-up aggregation: Parent values must always be the sum of their children
      const rowMap = {};
      mergedData.forEach(d => { rowMap[d.kategori_kode] = d; });

      // Sort parents by level descending (deepest first)
      const parentCodes = [...new Set(relevantCategories.map(c => c.parent_kode).filter(Boolean))];
      const sortedParentCodes = parentCodes.sort((a, b) => (refMap[b]?.level || 0) - (refMap[a]?.level || 0));

      sortedParentCodes.forEach(pCode => {
        const parentRow = rowMap[pCode];
        if (!parentRow) return;

        let sumAng = 0, sumReal = 0;
        let hasChildrenWithData = false;

        mergedData.forEach(child => {
          if (child._refParent === pCode) {
            sumAng += Number(child.anggaran || 0);
            sumReal += Number(child.realisasi || 0);
            hasChildrenWithData = true;
          }
        });

        // If children exist, we override parent totals with sum of children
        // This ensures the tree is mathematically consistent
        if (hasChildrenWithData) {
          parentRow.anggaran = sumAng;
          parentRow.realisasi = sumReal;
        }
      });

      // 6. Final Summary Calculation for the header stats
      const newSummary = { pajakR: 0, pajakA: 0, retribusiR: 0, retribusiA: 0, pengelolaanR: 0, pengelolaanA: 0, lainR: 0, lainA: 0 };
      mergedData.forEach(row => {
        const code = row.kategori_kode;
        if (code === 'PAD-PAJAK') { newSummary.pajakR = row.realisasi; newSummary.pajakA = row.anggaran; }
        else if (code === 'PAD-RETRIBUSI') { newSummary.retribusiR = row.realisasi; newSummary.retribusiA = row.anggaran; }
        else if (code === 'PAD-PENGELOLAAN') { newSummary.pengelolaanR = row.realisasi; newSummary.pengelolaanA = row.anggaran; }
        else if (code === 'PAD-LAIN') { newSummary.lainR = row.realisasi; newSummary.lainA = row.anggaran; }
      });

      // EMERGENCY FALLBACK: If top-level totals are still 0 but region summary has data, use it
      if (newSummary.pajakR === 0 && newSummary.retribusiR === 0 && region?.dataPerTahun) {
        const summary = region.dataPerTahun.find(d => d.tahun === year);
        if (summary) {
          if (rowMap['PAD-PAJAK']) { rowMap['PAD-PAJAK'].realisasi = summary.pajakRealisasi; rowMap['PAD-PAJAK'].anggaran = summary.pajakAnggaran; }
          if (rowMap['PAD-RETRIBUSI']) { rowMap['PAD-RETRIBUSI'].realisasi = summary.retribusiRealisasi; rowMap['PAD-RETRIBUSI'].anggaran = summary.retribusiAnggaran; }
          if (rowMap['PAD-PENGELOLAAN']) { rowMap['PAD-PENGELOLAAN'].realisasi = summary.pengelolaanRealisasi; rowMap['PAD-PENGELOLAAN'].anggaran = summary.pengelolaanAnggaran; }
          if (rowMap['PAD-LAIN']) { rowMap['PAD-LAIN'].realisasi = summary.lainPadRealisasi; rowMap['PAD-LAIN'].anggaran = summary.lainPadAnggaran; }
          
          newSummary.pajakR = summary.pajakRealisasi; newSummary.pajakA = summary.pajakAnggaran;
          newSummary.retribusiR = summary.retribusiRealisasi; newSummary.retribusiA = summary.retribusiAnggaran;
          newSummary.pengelolaanR = summary.pengelolaanRealisasi; newSummary.pengelolaanA = summary.pengelolaanAnggaran;
          newSummary.lainR = summary.lainPadRealisasi; newSummary.lainA = summary.lainPadAnggaran;
        }
      }

      // Auto-expand first 2 levels
      const initialExpanded = {};
      mergedData.forEach(d => {
        if (d._refLevel <= 2) initialExpanded[d.kategori_kode] = true;
      });

      setExpandedNodes(initialExpanded);
      setDetails(mergedData);
      setFilteredSummary(newSummary);
    } catch (err) {
      console.error('Error in loadDetails:', err);
      setDetails([]);
    } finally {
      setLoading(false);
    }
  }, [region]);

  React.useEffect(() => {
    if (!region) return;
    loadDetails(activeYearTab, region.daerah);
  }, [region, activeYearTab, loadDetails]);

  // Build maps for parent_kode tree navigation
  const { allCodesSet, parentMap, childrenOfMap } = React.useMemo(() => {
    const codesSet = new Set(details.map(d => d.kategori_kode).filter(Boolean));
    const pMap = {};   // kode -> parent_kode
    const cMap = {};   // parent_kode -> Set of child kodes in current data
    details.forEach(d => {
      const parentKode = d._refParent;
      if (parentKode) {
        pMap[d.kategori_kode] = parentKode;
        if (!cMap[parentKode]) cMap[parentKode] = new Set();
        cMap[parentKode].add(d.kategori_kode);
      }
    });
    return { allCodesSet: codesSet, parentMap: pMap, childrenOfMap: cMap };
  }, [details]);

  // Helper: is item visible given current expanded state?
  const isVisible = React.useCallback((kode, expanded, searchActive) => {
    if (searchActive) return true;
    if (!kode) return false;
    // Walk up the parent chain and check if all ancestors are expanded
    let current = parentMap[kode];
    while (current) {
      if (allCodesSet.has(current) && !expanded[current]) return false;
      current = parentMap[current];
    }
    return true;
  }, [allCodesSet, parentMap]);

  const toggleNode = (code) => {
    setExpandedNodes(prev => ({ ...prev, [code]: !prev[code] }));
  };

  const expandAll = () => {
    const allCodes = {};
    details.forEach(d => { if (d.kategori_kode) allCodes[d.kategori_kode] = true; });
    setExpandedNodes(allCodes);
  };

  const collapseAll = () => setExpandedNodes({});

  const applyFilter = () => {
    setSelectedCodes(tempSelectedCodes.size === 0 ? null : new Set(tempSelectedCodes));
    setIsFilterOpen(false);
  };

  const resetComponentFilter = () => {
    setSelectedCodes(null);
    setTempSelectedCodes(new Set());
  };

  const handleExport = (type = 'xlsx') => {
    // 1. Prepare data (flat structure for export)
    const exportData = filteredDetails.map((d, index) => ({
      'No': index + 1,
      'Kode': d.kategori_kode,
      'Komponen': d.ref_kategori_pad?.nama || '',
      'Kategori Utama': d.ref_kategori_pad?.kategori_utama || '',
      'Sub Kategori': d.ref_kategori_pad?.sub_kategori || '',
      'Anggaran': d.anggaran || 0,
      'Realisasi': d.realisasi || 0,
      'Capaian (%)': d.anggaran > 0 ? ((d.realisasi / d.anggaran) * 100).toFixed(2) : '0.00'
    }));

    if (type === 'xlsx') {
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "LRA Detail");
      
      // Auto-width for columns
      const max_width = exportData.reduce((w, r) => Math.max(w, r.Komponen.length), 10);
      worksheet["!cols"] = [ { wch: 5 }, { wch: 15 }, { wch: max_width + 5 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 12 } ];
      
      XLSX.writeFile(workbook, `LRA_${region.daerah}_${activeYearTab}.xlsx`);
    } else {
      // CSV Export
      const sep = ';';
      const headers = Object.keys(exportData[0]).join(sep);
      const rows = exportData.map(row => 
        Object.values(row).map(val => (typeof val === 'string' && (val.includes(sep) || val.includes(','))) ? `"${val}"` : val).join(sep)
      );
      const csvContent = "\uFEFF" + [headers, ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `LRA_${region.daerah}_${activeYearTab}.csv`);
      link.click();
    }
  };

  const leafNodes = React.useMemo(() => {
    // Leaf nodes = nodes that have no children in the current dataset
    return details.filter(d => !childrenOfMap[d.kategori_kode] || childrenOfMap[d.kategori_kode].size === 0);
  }, [details, childrenOfMap]);

  const filteredDetails = React.useMemo(() => {
    let result = details;
    
    // 1. Filter by Component Selection
    if (selectedCodes) {
      // Find all codes that should be visible (selected ones + their ancestors)
      const visibleCodes = new Set();
      details.forEach(d => {
        if (selectedCodes.has(d.kategori_kode)) {
          visibleCodes.add(d.kategori_kode);
          // Walk up parent chain to add all ancestors
          let parent = d._refParent;
          while (parent) {
            visibleCodes.add(parent);
            const parentRow = details.find(p => p.kategori_kode === parent);
            parent = parentRow?._refParent;
          }
        }
      });
      result = result.filter(d => visibleCodes.has(d.kategori_kode));
    }

    // 2. Filter by Search Term
    if (searchTerm) {
      result = result.filter(d => 
        (d.ref_kategori_pad?.nama || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.kategori_kode || '').includes(searchTerm)
      );
    }
    
    return result;
  }, [details, searchTerm, selectedCodes]);

  if (!region) return null;

  // Prepare yearly trend chart data
  const chartData = [...region.dataPerTahun]
    .sort((a, b) => a.tahun - b.tahun)
    .map(d => ({
      year: d.tahun.toString(),
      total: d.pajakRealisasi + d.retribusiRealisasi + d.pengelolaanRealisasi + d.lainPadRealisasi,
      pajak: d.pajakRealisasi,
      retribusi: d.retribusiRealisasi,
      pengelolaan: d.pengelolaanRealisasi,
      lain: d.lainPadRealisasi,
      anggaran: d.pajakAnggaran + d.retribusiAnggaran + d.pengelolaanAnggaran + d.lainPadAnggaran,
    }));

  // Current year data - RECALCULATED based on UU HKPD if available
  const currentYearData = region.dataPerTahun.find(d => d.tahun === activeYearTab) || {};
  
  const displaySummary = React.useMemo(() => {
    if (isAllMode) {
      return {
        pajakR: region.totalPajak || 0,
        pajakA: region.totalPajakAnggaran || 0,
        retribusiR: region.totalRetribusi || 0,
        retribusiA: region.totalRetribusiAnggaran || 0,
        pengelolaanR: region.totalPengelolaan || 0,
        pengelolaanA: region.totalPengelolaanAnggaran || 0,
        lainR: region.totalLain || 0,
        lainA: region.totalLainAnggaran || 0,
        totalR: region.totalRealisasi || 0,
        totalA: region.totalAnggaran || 0,
      };
    }
    if (filteredSummary) {
      return {
        pajakR: filteredSummary.pajakR,
        pajakA: filteredSummary.pajakA,
        retribusiR: filteredSummary.retribusiR,
        retribusiA: filteredSummary.retribusiA,
        pengelolaanR: filteredSummary.pengelolaanR,
        pengelolaanA: filteredSummary.pengelolaanA,
        lainR: filteredSummary.lainR,
        lainA: filteredSummary.lainA,
        totalR: filteredSummary.pajakR + filteredSummary.retribusiR + filteredSummary.pengelolaanR + filteredSummary.lainR,
        totalA: filteredSummary.pajakA + filteredSummary.retribusiA + filteredSummary.pengelolaanA + filteredSummary.lainA,
      };
    }
    // Fallback if detail data not loaded/matched
    return {
      pajakR: currentYearData.pajakRealisasi || 0,
      pajakA: currentYearData.pajakAnggaran || 0,
      retribusiR: currentYearData.retribusiRealisasi || 0,
      retribusiA: currentYearData.retribusiAnggaran || 0,
      pengelolaanR: currentYearData.pengelolaanRealisasi || 0,
      pengelolaanA: currentYearData.pengelolaanAnggaran || 0,
      lainR: currentYearData.lainPadRealisasi || 0,
      lainA: currentYearData.lainPadAnggaran || 0,
      totalR: (currentYearData.pajakRealisasi || 0) + (currentYearData.retribusiRealisasi || 0) + (currentYearData.pengelolaanRealisasi || 0) + (currentYearData.lainPadRealisasi || 0),
      totalA: (currentYearData.pajakAnggaran || 0) + (currentYearData.retribusiAnggaran || 0) + (currentYearData.pengelolaanAnggaran || 0) + (currentYearData.lainPadAnggaran || 0),
    };
  }, [isAllMode, filteredSummary, currentYearData, region]);

  const totalRealisasiThisYear = displaySummary.totalR;
  const totalAnggaranThisYear = displaySummary.totalA;
  const capaianPct = totalAnggaranThisYear > 0 ? (totalRealisasiThisYear / totalAnggaranThisYear) * 100 : 0;
  
  // Update Pie data to use displaySummary
  const pieData = [
    { name: 'Pajak', value: displaySummary.pajakR, color: '#6366f1' },
    { name: 'Retribusi', value: displaySummary.retribusiR, color: '#10b981' },
    { name: 'Pengelolaan', value: displaySummary.pengelolaanR, color: '#3b82f6' },
    { name: 'Lain-lain', value: displaySummary.lainR, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  // LRA level-0 items (top-level kategori) for summary
  const topLevelItems = details.filter(d => {
    const parts = (d.kategori_kode || '').split('.');
    return parts.length === 1 || (parts.length === 2 && parts[1] === '0');
  });

  // Growth calculation
  const prevYear = region.dataPerTahun.find(d => d.tahun === activeYearTab - 1);
  const prevTotal = prevYear ? (prevYear.pajakRealisasi + prevYear.retribusiRealisasi + prevYear.pengelolaanRealisasi + prevYear.lainPadRealisasi) : null;
  const growthPct = prevTotal ? ((totalRealisasiThisYear - prevTotal) / prevTotal) * 100 : null;

  const availableYears = [...region.dataPerTahun].map(d => d.tahun).sort((a, b) => b - a);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-6"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={onClose} />

      {/* Modal Content */}
      <motion.div 
        initial={{ scale: 0.92, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.92, y: 30, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative bg-[#020617] w-full max-w-7xl max-h-[96vh] overflow-y-auto rounded-3xl shadow-2xl flex flex-col border border-white/10"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}
      >
        {/* ===== HEADER ===== */}
        <div className="relative bg-gradient-to-br from-slate-900 via-brand-900 to-indigo-950 p-6 md:p-10 rounded-t-3xl overflow-hidden">
          {/* Decorative BG */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-400 rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl" />
            <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-blue-400 rounded-full translate-y-1/3 blur-3xl" />
          </div>

          <button 
            onClick={onClose}
            className="absolute top-5 right-5 p-2.5 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white rounded-xl transition-all backdrop-blur-sm"
          >
            <X size={20} />
          </button>

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              {/* Badge */}
              <div className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center text-white text-4xl font-black shadow-2xl shrink-0 ${
                region.tipe === 'Provinsi' ? 'bg-brand-500/80' : 
                region.tipe === 'Kota' ? 'bg-blue-600/80' : 'bg-emerald-600/80'
              } backdrop-blur-sm ring-2 ring-white/20`}>
                {region.daerah.substring(0, 1)}
              </div>
              <div className="flex-grow">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h2 className="font-black text-3xl md:text-4xl text-force-white uppercase tracking-tight leading-none">{region.daerah}</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                    region.tipe === 'Provinsi' ? 'bg-brand-500/30' :
                    region.tipe === 'Kota' ? 'bg-blue-500/30' : 'bg-emerald-500/30'
                  } text-force-white`}>{region.tipe}</span>
                </div>
                <p className="text-slate-300 text-sm flex items-center gap-2 mt-2">
                  <Calendar size={14} />
                  Data tersedia {region.tahunList.length} periode ({Math.min(...region.tahunList)}–{Math.max(...region.tahunList)})
                </p>

                {/* Quick stats row */}
                <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: isAllMode ? 'Total Akumulasi' : `Realisasi ${activeYearTab}`, value: formatCurrency(totalRealisasiThisYear), color: 'text-white', icon: TrendingUp },
                    { label: 'Capaian Target', value: `${capaianPct.toFixed(1)}%`, color: capaianPct >= 100 ? 'text-emerald-400' : capaianPct >= 80 ? 'text-amber-400' : 'text-rose-400', icon: Target },
                    { label: 'Target Anggaran', value: formatCurrency(totalAnggaranThisYear), color: 'text-slate-300', icon: BarChart3 },
                    { label: 'Pertumbuhan YoY', value: growthPct !== null ? `${growthPct >= 0 ? '+' : ''}${growthPct.toFixed(1)}%` : 'N/A', color: growthPct && growthPct >= 0 ? 'text-emerald-400' : 'text-rose-400', icon: ArrowUpRight },
                  ].map((s, i) => (
                    <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 ring-1 ring-white/10">
                      <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">{s.label}</p>
                      <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Year Tabs */}
            <div className="flex items-center gap-2 mt-6 flex-wrap">
              <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest mr-2">Pilih Tahun:</span>
              <button
                onClick={() => { setIsAllMode(true); setActiveYearTab(latestYear); }}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  isAllMode 
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' 
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                SEMUA
              </button>
              {availableYears.map(y => (
                <button
                  key={y}
                  onClick={() => { setIsAllMode(false); setActiveYearTab(y); }}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    !isAllMode && activeYearTab === y 
                      ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' 
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ===== SECTION NAV TABS ===== */}
        <div className="bg-[#01040a]/80 backdrop-blur-xl border-b border-white/5 px-6 md:px-10 sticky top-0 z-10 shadow-sm">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: 'overview', label: 'Ringkasan', icon: BarChart3 },
              { id: 'trend', label: 'Tren Tahunan', icon: TrendingUp },
              { id: 'detail', label: 'Rincian LRA', icon: List },
              { id: 'table', label: 'Tabel Data', icon: Database },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveDetailTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 text-xs font-black uppercase tracking-wider whitespace-nowrap border-b-2 transition-all ${
                  activeDetailTab === tab.id
                    ? 'border-brand-400 text-brand-400'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ===== BODY ===== */}
        <div className="p-5 md:p-10 space-y-8">

          {/* TAB: OVERVIEW */}
          {activeDetailTab === 'overview' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              {/* 4 Component Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Pajak Daerah', realisasi: displaySummary.pajakR, anggaran: displaySummary.pajakA, cat: 'pajak' },
                  { label: 'Retribusi Daerah', realisasi: displaySummary.retribusiR, anggaran: displaySummary.retribusiA, cat: 'retribusi' },
                  { label: 'Pengelolaan Kekayaan', realisasi: displaySummary.pengelolaanR, anggaran: displaySummary.pengelolaanA, cat: 'pengelolaan' },
                  { label: 'Lain-lain PAD', realisasi: displaySummary.lainR, anggaran: displaySummary.lainA, cat: 'lain' },
                ].map((comp, i) => {
                  const pct = comp.anggaran > 0 ? Math.min(200, (comp.realisasi / comp.anggaran) * 100) : 0;
                  const col = KATEGORI_COLORS[comp.cat];
                  const share = totalRealisasiThisYear > 0 ? (comp.realisasi / totalRealisasiThisYear) * 100 : 0;
                  return (
                    <div key={i} className={`bg-white/5 rounded-2xl p-5 border border-white/10 relative overflow-hidden transition-all hover:bg-white/10`}>
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${col.bg}`} />
                      <div className="pl-2">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">{comp.label}</p>
                        <p className="text-lg font-black text-white mb-1">{formatCurrency(comp.realisasi)}</p>
                        <div className="flex items-center justify-between text-[9px] mb-2">
                          <span className="text-slate-400">vs Anggaran: {formatCurrency(comp.anggaran)}</span>
                          <span className={`font-black ${pct >= 100 ? 'text-emerald-500' : 'text-amber-500'}`}>{pct.toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, pct)}%` }}
                            transition={{ delay: i * 0.1, duration: 0.6 }}
                            className={`h-full rounded-full ${col.bg}`}
                          />
                        </div>
                        <p className={`text-[9px] font-black mt-2 ${col.text}`}>
                          {share.toFixed(1)}% dari total PAD
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h4 className="font-black text-white text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
                    <BarChart3 size={16} className="text-brand-500" /> Proporsi Komponen PAD {activeYearTab}
                  </h4>
                  <div className="flex items-center gap-6">
                    <div className="h-[200px] flex-grow">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                            {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                          <Tooltip formatter={(val) => formatCurrency(val)} contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '11px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-3 shrink-0">
                      {pieData.map((d, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                          <div>
                            <p className="text-xs font-black text-slate-200">{d.name}</p>
                            <p className="text-[10px] text-slate-500">{formatCurrency(d.value)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Capaian Gauge */}
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h4 className="font-black text-white text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Target size={16} className="text-brand-500" /> Capaian vs Target {activeYearTab}
                  </h4>
                  <div className="space-y-4">
                    {[
                      { label: 'Pajak', realisasi: displaySummary.pajakR, anggaran: displaySummary.pajakA, color: '#6366f1' },
                      { label: 'Retribusi', realisasi: displaySummary.retribusiR, anggaran: displaySummary.retribusiA, color: '#10b981' },
                      { label: 'Pengelolaan', realisasi: displaySummary.pengelolaanR, anggaran: displaySummary.pengelolaanA, color: '#3b82f6' },
                      { label: 'Lain-lain', realisasi: displaySummary.lainR, anggaran: displaySummary.lainA, color: '#f59e0b' },
                    ].map((item, i) => {
                      const pct = item.anggaran > 0 ? Math.min(100, (item.realisasi / item.anggaran) * 100) : 0;
                      return (
                        <div key={i}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-slate-300">{item.label}</span>
                            <span className="text-xs font-black" style={{ color: pct >= 100 ? '#34d399' : item.color }}>{pct.toFixed(1)}%</span>
                          </div>
                          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ delay: i * 0.1 + 0.2, duration: 0.7 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                          </div>
                          <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                            <span>{formatCurrency(item.realisasi)}</span>
                            <span>Target: {formatCurrency(item.anggaran)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Insight box */}
              <div className={`rounded-2xl p-6 flex items-start gap-4 ${capaianPct >= 100 ? 'bg-emerald-500/10 border border-emerald-500/20' : capaianPct >= 80 ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-rose-500/10 border border-rose-500/20'}`}>
                <div className={`p-3 rounded-xl shrink-0 ${capaianPct >= 100 ? 'bg-emerald-500 text-white' : capaianPct >= 80 ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white'}`}>
                  {capaianPct >= 100 ? <Award size={20} /> : capaianPct >= 80 ? <Target size={20} /> : <AlertTriangle size={20} />}
                </div>
                <div>
                  <p className={`font-black text-sm uppercase tracking-wider mb-1 ${capaianPct >= 100 ? 'text-emerald-400' : capaianPct >= 80 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {capaianPct >= 100 ? '🏆 Target Terlampaui' : capaianPct >= 80 ? '⚡ Mendekati Target' : '⚠️ Di Bawah Target'}
                  </p>
                  <p className={`text-sm ${capaianPct >= 100 ? 'text-emerald-400' : capaianPct >= 80 ? 'text-amber-400' : 'text-rose-400'}`}>
                    Realisasi PAD {region.daerah} tahun {activeYearTab} mencapai <strong>{formatCurrency(totalRealisasiThisYear)}</strong> ({capaianPct.toFixed(1)}% dari target {formatCurrency(totalAnggaranThisYear)}).
                    {growthPct !== null && ` Dibandingkan tahun sebelumnya, ${growthPct >= 0 ? 'tumbuh' : 'turun'} ${Math.abs(growthPct).toFixed(1)}%.`}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB: TREND */}
          {activeDetailTab === 'trend' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Area Chart */}
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h4 className="font-black text-white text-sm mb-6 flex items-center gap-2 uppercase tracking-widest">
                  <TrendingUp size={16} className="text-brand-500" /> Tren Total Realisasi PAD
                </h4>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1a237e" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#1a237e" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradAnggaran" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(v) => formatCurrency(v)} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontSize: '11px' }} formatter={(v, name) => [formatCurrency(v), name === 'total' ? 'Realisasi' : 'Anggaran']} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                      <Area type="monotone" dataKey="anggaran" name="Anggaran" stroke="#f59e0b" strokeWidth={2} strokeDasharray="6 3" fillOpacity={1} fill="url(#gradAnggaran)" dot={false} />
                      <Area type="monotone" dataKey="total" name="Realisasi" stroke="#1a237e" strokeWidth={3} fillOpacity={1} fill="url(#gradTotal)" dot={{ r: 5, fill: '#1a237e', strokeWidth: 2, stroke: 'white' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Stacked Bar */}
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h4 className="font-black text-white text-sm mb-6 flex items-center gap-2 uppercase tracking-widest">
                  <BarChart3 size={16} className="text-emerald-500" /> Komposisi Komponen PAD per Tahun
                </h4>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(v) => formatCurrency(v)} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontSize: '11px' }} formatter={(v, name) => [formatCurrency(v), name]} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                      <Bar dataKey="pajak" name="Pajak" stackId="a" fill="#6366f1" radius={[0,0,0,0]} />
                      <Bar dataKey="retribusi" name="Retribusi" stackId="a" fill="#10b981" />
                      <Bar dataKey="pengelolaan" name="Pengelolaan" stackId="a" fill="#3b82f6" />
                      <Bar dataKey="lain" name="Lain-lain" stackId="a" fill="#f59e0b" radius={[6,6,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* YoY Growth rates */}
              {chartData.length > 1 && (
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h4 className="font-black text-white text-sm mb-6 flex items-center gap-2 uppercase tracking-widest">
                    <ArrowUpRight size={16} className="text-indigo-500" /> Pertumbuhan Year-on-Year (YoY)
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {chartData.slice(1).map((d, i) => {
                      const prev = chartData[i];
                      const growth = prev.total > 0 ? ((d.total - prev.total) / prev.total) * 100 : 0;
                      return (
                        <div key={i} className={`p-4 rounded-xl text-center ${growth >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                          <p className="text-[9px] font-black text-slate-500 uppercase">{prev.year} → {d.year}</p>
                          <p className={`text-2xl font-black mt-1 ${growth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
                          </p>
                          <p className="text-[9px] text-slate-400 mt-1">{formatCurrency(d.total - prev.total)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB: DETAIL LRA */}
          {activeDetailTab === 'detail' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Toolbar */}
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Cari komponen LRA..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2.5 bg-white/5 rounded-xl w-full text-xs font-bold border border-white/10 focus:ring-2 focus:ring-brand-500 outline-none text-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  {/* Multi-Select Component Filter */}
                  <div className="relative">
                    <button 
                      onClick={() => setIsFilterOpen(!isFilterOpen)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all border ${
                        selectedCodes 
                          ? 'bg-brand-500 text-white border-brand-500 shadow-lg shadow-brand-500/20' 
                          : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                      }`}
                    >
                    <List size={12} /> Filter Komponen {selectedCodes && `(${selectedCodes.size})`}
                  </button>

                  <AnimatePresence>
                    {isFilterOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-72 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 p-4"
                      >
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pilih Komponen</h5>
                            <button 
                              onClick={() => {
                                if (tempSelectedCodes.size === leafNodes.length) {
                                  setTempSelectedCodes(new Set());
                                } else {
                                  setTempSelectedCodes(new Set(leafNodes.map(n => n.kategori_kode)));
                                }
                              }}
                              className="text-[9px] font-black text-brand-400 hover:underline"
                            >
                              {tempSelectedCodes.size === leafNodes.length ? 'Unselect All' : 'Select All'}
                            </button>
                          </div>
                          
                          <div className="max-h-64 overflow-y-auto space-y-1 mb-4 pr-1 custom-scrollbar" style={{ scrollbarWidth: 'thin' }}>
                            {leafNodes.map(node => (
                              <label key={node.kategori_kode} className="flex items-center gap-2 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors group">
                                <input 
                                  type="checkbox"
                                  checked={tempSelectedCodes.has(node.kategori_kode)}
                                  onChange={() => {
                                    const next = new Set(tempSelectedCodes);
                                    if (next.has(node.kategori_kode)) next.delete(node.kategori_kode);
                                    else next.add(node.kategori_kode);
                                    setTempSelectedCodes(next);
                                  }}
                                  className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-brand-500 focus:ring-brand-500 focus:ring-offset-slate-900"
                                />
                                <span className="text-[11px] text-slate-300 group-hover:text-white transition-colors">{node.ref_kategori_pad?.nama || node.kategori_kode}</span>
                              </label>
                            ))}
                          </div>

                          <div className="flex gap-2">
                            <button 
                              onClick={resetComponentFilter}
                              className="flex-grow py-2 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black rounded-lg transition-all"
                            >
                              Reset
                            </button>
                            <button 
                              onClick={applyFilter}
                              className="flex-grow py-2 bg-brand-500 hover:bg-brand-600 text-white text-[10px] font-black rounded-lg transition-all shadow-lg shadow-brand-500/20"
                            >
                              Apply Filter
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button onClick={expandAll} className="flex items-center gap-1.5 px-3 py-2 bg-brand-500/10 text-brand-400 rounded-xl text-xs font-black hover:bg-brand-500/20 transition-all border border-brand-500/20">
                    <Maximize2 size={12} /> Expand All
                  </button>
                  <button onClick={collapseAll} className="flex items-center gap-1.5 px-3 py-2 bg-white/5 text-slate-400 rounded-xl text-xs font-black hover:bg-white/10 transition-all border border-white/10">
                    <RefreshCw size={12} /> Collapse
                  </button>
                  <button
                    onClick={() => setViewMode(m => m === 'hierarchy' ? 'grid' : 'hierarchy')}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white/5 text-slate-400 rounded-xl text-xs font-black hover:bg-white/10 transition-all border border-white/10"
                  >
                    {viewMode === 'hierarchy' ? <><LayoutGrid size={12} /> Grid</> : <><List size={12} /> Tree</>}
                  </button>

                  <div className="flex items-center gap-1.5 ml-auto border-l border-white/10 pl-3">
                    <button 
                      onClick={() => handleExport('xlsx')}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 hover:bg-emerald-600/30 transition-all shadow-lg shadow-emerald-600/5 group"
                    >
                      <FileSpreadsheet size={12} className="group-hover:scale-110 transition-transform" /> Excel
                    </button>
                    <button 
                      onClick={() => handleExport('csv')}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black bg-brand-500/20 text-brand-400 border border-brand-500/30 hover:bg-brand-500/30 transition-all group"
                    >
                      <Download size={12} className="group-hover:translate-y-0.5 transition-transform" /> CSV
                    </button>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="bg-white rounded-2xl py-24 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Memuat data LRA dari server...</p>
                </div>
              ) : details.length === 0 ? (
                <div className="bg-white rounded-2xl py-24 text-center">
                  <Database size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-400 font-bold">Belum ada rincian data LRA untuk tahun {activeYearTab}</p>
                  <p className="text-slate-300 text-sm mt-2">Data detail mungkin belum tersedia di database</p>
                </div>
              ) : viewMode === 'hierarchy' ? (
                <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#01040a] text-white sticky top-0">
                        <tr>
                          <th className="p-4 text-left font-black text-[10px] uppercase tracking-widest">Kode & Komponen PAD</th>
                          <th className="p-4 text-right font-black text-[10px] uppercase tracking-widest min-w-[130px]">Anggaran</th>
                          <th className="p-4 text-right font-black text-[10px] uppercase tracking-widest min-w-[130px]">Realisasi</th>
                          <th className="p-4 text-center font-black text-[10px] uppercase tracking-widest min-w-[100px]">Capaian</th>
                          <th className="p-4 text-center font-black text-[10px] uppercase tracking-widest min-w-[80px]">Grafik</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredDetails.map((item, idx) => {
                          const code = item.kategori_kode || '';
                          const level = (item._refLevel || 1) - 1; // 0-indexed for styling

                          // Use isVisible helper — checks ALL ancestors are expanded
                          if (!isVisible(code, expandedNodes, !!searchTerm)) return null;

                          const hasChildren = !!(childrenOfMap[code] && childrenOfMap[code].size > 0);
                          const isExpanded = expandedNodes[code];
                          const isSynthetic = item._synthetic;
                          const tingkat = item._refTingkat;

                          const pct = item.anggaran > 0 ? (item.realisasi / item.anggaran) * 100 : 0;
                          
                          // Level styles based on actual hierarchy depth
                          const levelStyles = [
                            'bg-white/5 font-black text-white text-sm border-l-4 border-brand-500',
                            'bg-white/[0.02] font-bold text-slate-200 text-xs border-l-2 border-brand-400',
                            'bg-transparent font-semibold text-slate-300 text-xs',
                            'bg-transparent font-medium text-slate-400 text-[11px]',
                          ];

                          // Determine icon color for code badge
                          const codeBadgeClass = level === 0 ? 'bg-brand-500/20 text-brand-400 font-bold' : 
                                                 level === 1 ? 'bg-brand-500/10 text-brand-400' :
                                                 hasChildren ? 'bg-amber-500/10 text-amber-400' : 'bg-white/5 text-slate-500';

                          // Determine sektor tag
                          const isProvTax = tingkat === 'provinsi';
                          const isKabTax = tingkat === 'kabupaten_kota';

                          return (
                            <motion.tr
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              key={code || idx}
                              onClick={() => hasChildren && toggleNode(code)}
                              className={`group transition-all duration-150 ${hasChildren ? 'cursor-pointer' : ''} hover:bg-white/10 ${levelStyles[Math.min(level, 3)]}`}
                            >
                              <td className="py-3 pr-4">
                                <div className="flex items-center" style={{ paddingLeft: `${8 + Math.min(level, 6) * 20}px` }}>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); hasChildren && toggleNode(code); }}
                                    className={`mr-2 w-6 h-6 rounded-md flex items-center justify-center transition-all shrink-0 ${hasChildren ? 'hover:bg-brand-500/20 text-brand-400 cursor-pointer' : 'opacity-0 cursor-default'}`}
                                  >
                                    {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                                  </button>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded shrink-0 ${codeBadgeClass}`}>{code}</span>
                                      <span className={`truncate ${isSynthetic && hasChildren ? 'font-bold' : ''} ${isProvTax ? 'text-indigo-400' : isKabTax ? 'text-emerald-400' : ''}`}>
                                        {item.ref_kategori_pad?.nama || code}
                                      </span>
                                      {isProvTax && level >= 1 && (
                                        <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded text-[7px] font-black uppercase shrink-0">Provinsi</span>
                                      )}
                                      {isKabTax && level >= 1 && (
                                        <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[7px] font-black uppercase shrink-0">Kab/Kota</span>
                                      )}
                                      {isSynthetic && hasChildren && !isProvTax && !isKabTax && tingkat === 'semua' && level >= 1 && (
                                        <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[7px] font-black uppercase shrink-0">Kategori</span>
                                      )}
                                      {!hasChildren && level >= 2 && (
                                        <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded text-[7px] font-black uppercase shrink-0">Rincian</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 text-right pr-4">
                                <span className={`text-[11px] tabular-nums ${item.anggaran > 0 ? (isSynthetic ? 'text-slate-500 font-medium italic' : 'text-slate-400 font-semibold') : 'text-slate-700'}`}>
                                  {item.anggaran > 0 ? formatCurrency(item.anggaran) : '—'}
                                </span>
                              </td>
                              <td className="py-3 text-right pr-4">
                                <div className="flex flex-col items-end">
                                  <span className={`tabular-nums ${item.realisasi > 0 ? (level <= 1 ? 'text-white text-sm font-black' : isSynthetic ? 'text-slate-300 text-xs font-semibold italic' : 'text-slate-200 text-xs font-bold') : 'text-slate-600 text-xs'}`}>
                                    {formatCurrency(item.realisasi)}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                {item.anggaran > 0 ? (
                                  <span className={`text-xs font-black ${pct >= 100 ? 'text-emerald-600' : pct >= 80 ? 'text-amber-600' : 'text-rose-600'}`}>
                                    {pct.toFixed(1)}%
                                  </span>
                                ) : <span className="text-slate-300 text-xs">—</span>}
                              </td>
                              <td className="py-3 px-4">
                                {item.anggaran > 0 ? (
                                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden max-w-[70px] mx-auto">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${Math.min(100, pct)}%` }}
                                      className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : pct >= 80 ? 'bg-amber-500' : 'bg-rose-400'}`}
                                    />
                                  </div>
                                ) : null}
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-4 bg-slate-50 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    {filteredDetails.filter(d => !d._synthetic).length} data rincian + {filteredDetails.filter(d => d._synthetic).length} kategori — Total {filteredDetails.length} baris — Klik baris untuk expand/collapse
                  </div>
                </div>
              ) : (
                /* Grid mode */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDetails.filter(d => d.realisasi > 0 || d.anggaran > 0).map((item, idx) => {
                    const pct = item.anggaran > 0 ? Math.min(100, (item.realisasi / item.anggaran) * 100) : 0;
                    const cat = item.ref_kategori_pad?.kategori_utama || 'lain';
                    const col = KATEGORI_COLORS[cat] || KATEGORI_COLORS.lain;
                    return (
                      <motion.div key={idx} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.02 }}
                        className="p-5 bg-white rounded-2xl ring-1 ring-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group"
                      >
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider mb-3 ${col.light} ${col.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${col.bg}`} />
                          {cat}
                        </div>
                        <p className="text-xs font-bold text-slate-700 mb-3 line-clamp-2">{item.ref_kategori_pad?.nama || 'N/A'}</p>
                        <p className="text-lg font-black text-slate-900 mb-2">{formatCurrency(item.realisasi)}</p>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className={`h-full rounded-full ${col.bg}`} />
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-400">
                          <span>Anggaran: {formatCurrency(item.anggaran)}</span>
                          <span className={`font-black ${pct >= 100 ? 'text-emerald-500' : col.text}`}>{pct.toFixed(0)}%</span>
                        </div>
                        <p className="text-[9px] font-mono text-slate-300 mt-2">{item.kategori_kode}</p>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB: TABLE DATA */}
          {activeDetailTab === 'table' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="font-black text-slate-900 text-sm uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={16} /> Tabulasi Data Semua Periode
                  </h4>
                  <button
                    onClick={() => {
                      const csv = [
                        ['Tahun','Pajak Anggaran','Pajak Realisasi','Retribusi Anggaran','Retribusi Realisasi','Pengelolaan Anggaran','Pengelolaan Realisasi','Lain PAD Anggaran','Lain PAD Realisasi','Total Anggaran','Total Realisasi','Capaian %'].join(','),
                        ...[...chartData].reverse().map(d => {
                          // Find original year data for complete component breakdown
                          const yd = region.dataPerTahun.find(r => r.tahun === parseInt(d.year)) || {};
                          return [
                            d.year,
                            yd.pajakAnggaran || 0, d.pajak,
                            yd.retribusiAnggaran || 0, d.retribusi,
                            yd.pengelolaanAnggaran || 0, d.pengelolaan,
                            yd.lainPadAnggaran || 0, d.lain,
                            d.anggaran, d.total,
                            ((d.total / (d.anggaran || 1)) * 100).toFixed(1)
                          ].join(',');
                        })
                      ].join('\n');
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${region.daerah}_PAD_${activeYearTab}.csv`;
                      a.click();
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl text-xs font-black hover:bg-brand-600 transition-all"
                  >
                    <Download size={13} /> Export CSV
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b border-slate-100 bg-slate-50">
                      <tr>
                        {['Tahun','Pajak','Retribusi','Pengelolaan','Lain-lain','Total Anggaran','Total Realisasi','Capaian'].map(h => (
                          <th key={h} className="p-5 font-black text-slate-400 text-[10px] uppercase tracking-widest">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...chartData].reverse().map((d, i) => {
                        const capaian = d.anggaran > 0 ? (d.total / d.anggaran) * 100 : 0;
                        return (
                          <tr key={i} className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${d.year == activeYearTab ? 'bg-brand-50/20 ring-1 ring-inset ring-brand-100' : ''}`}>
                            <td className="p-5">
                              <span className={`px-3 py-1 rounded-lg font-black text-xs ${d.year == activeYearTab ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                {d.year}
                              </span>
                            </td>
                            <td className="p-5 text-slate-600 font-semibold text-xs">{formatCurrency(d.pajak)}</td>
                            <td className="p-5 text-slate-600 font-semibold text-xs">{formatCurrency(d.retribusi)}</td>
                            <td className="p-5 text-slate-600 font-semibold text-xs">{formatCurrency(d.pengelolaan)}</td>
                            <td className="p-5 text-slate-600 font-semibold text-xs">{formatCurrency(d.lain)}</td>
                            <td className="p-5 text-slate-700 font-bold text-xs">{formatCurrency(d.anggaran)}</td>
                            <td className="p-5 text-slate-900 font-black text-sm">{formatCurrency(d.total)}</td>
                            <td className="p-5">
                              <div className="flex items-center gap-2">
                                <div className="w-14 h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${capaian >= 100 ? 'bg-emerald-500' : capaian >= 80 ? 'bg-amber-500' : 'bg-rose-400'}`}
                                    style={{ width: `${Math.min(100, capaian)}%` }}
                                  />
                                </div>
                                <span className={`font-black text-xs ${capaian >= 100 ? 'text-emerald-600' : capaian >= 80 ? 'text-amber-600' : 'text-rose-600'}`}>
                                  {capaian.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                      <tr>
                        <td className="p-5 font-black text-slate-900 uppercase text-[10px] tracking-widest">TOTAL</td>
                        <td className="p-5 font-black text-indigo-600 text-sm">{formatCurrency(chartData.reduce((s, d) => s + d.pajak, 0))}</td>
                        <td className="p-5 font-black text-emerald-600 text-sm">{formatCurrency(chartData.reduce((s, d) => s + d.retribusi, 0))}</td>
                        <td className="p-5 font-black text-blue-600 text-sm">{formatCurrency(chartData.reduce((s, d) => s + d.pengelolaan, 0))}</td>
                        <td className="p-5 font-black text-amber-600 text-sm">{formatCurrency(chartData.reduce((s, d) => s + d.lain, 0))}</td>
                        <td className="p-5 font-black text-slate-700 text-sm">{formatCurrency(chartData.reduce((s, d) => s + d.anggaran, 0))}</td>
                        <td className="p-5 font-black text-brand-600 text-lg">{formatCurrency(chartData.reduce((s, d) => s + d.total, 0))}</td>
                        <td className="p-5 font-black text-slate-500 text-xs">5 tahun</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest bg-white border-t border-slate-100 rounded-b-3xl">
          PAD JAWA PORTAL • Data: Supabase Cloud • {new Date().getFullYear()}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DetailModal;

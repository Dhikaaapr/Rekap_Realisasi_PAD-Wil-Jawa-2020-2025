import React from 'react';
const { useState, useMemo } = React;
import { 
  Search, Download, Filter, ArrowUpDown, ChevronLeft, ChevronRight, FileSpreadsheet, 
  TrendingUp, TrendingDown, BarChart3, Calendar, Database, Layers, Eye,
  ArrowUpRight, Building2, Award, Target, AlertTriangle, ChevronDown, ChevronUp,
  RefreshCw, X, SortAsc, SortDesc, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  LineChart, Line, Legend
} from 'recharts';
import { PROVINCE_KABKOTA } from '../lib/supabase';

const formatCurrency = (val) => {
  if (!val || val === 0) return 'Rp 0';
  if (val >= 1e12) return `Rp ${(val / 1e12).toFixed(2)} T`;
  if (val >= 1e9) return `Rp ${(val / 1e9).toFixed(1)} M`;
  if (val >= 1e6) return `Rp ${(val / 1e6).toFixed(0)} Jt`;
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);
};

const ITEMS_PER_PAGE = 15;

const DataMaster = ({ allData, onRegionClick, activeMetric = 'rataRataPAD', subDataLookup = {}, metricLabel = 'PAD Total' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('realisasi');
  const [sortDir, setSortDir] = useState('desc');
  const [filterYear, setFilterYear] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterProv, setFilterProv] = useState('all');
  const [activeView, setActiveView] = useState('table'); // 'table' | 'trend'
  const [expandedRow, setExpandedRow] = useState(null);

  // Flatten data for raw table view
  const flattened = useMemo(() => {
    const rows = [];
    allData.forEach(region => {
      region.dataPerTahun.forEach(yearData => {
        let realisasi = 0;
        let anggaran = 0;

        if (subDataLookup && subDataLookup[region.daerah]) {
           // Handle case where we might want year-specific sub-data?
           // For now aggregate lookup is shared as summary? 
           // Actually fetchDetailDataByCategory returns by year so we should probably filter it.
           // BUT regionalSubData in App is already aggregated for the selectedYear.
           // For simplicity in the master table (which shows ALL years), 
           // let's apply the sub-metric filter only if the year matches selectedYear 
           // OR if we want it to apply across all years if aggregated.
           realisasi = subDataLookup[region.daerah].realisasi || 0;
           anggaran = subDataLookup[region.daerah].anggaran || 0;
        } else if (activeMetric === 'rataRataPajak') {
          realisasi = yearData.pajakRealisasi || 0;
          anggaran = yearData.pajakAnggaran || 0;
        } else if (activeMetric === 'rataRataRetribusi') {
          realisasi = yearData.retribusiRealisasi || 0;
          anggaran = yearData.retribusiAnggaran || 0;
        } else if (activeMetric === 'rataRataPengelolaan') {
          realisasi = yearData.pengelolaanRealisasi || 0;
          anggaran = yearData.pengelolaanAnggaran || 0;
        } else if (activeMetric === 'rataRataLain') {
          realisasi = yearData.lainPadRealisasi || 0;
          anggaran = yearData.lainPadAnggaran || 0;
        } else {
          realisasi = (yearData.pajakRealisasi || 0) + (yearData.retribusiRealisasi || 0) + (yearData.pengelolaanRealisasi || 0) + (yearData.lainPadRealisasi || 0);
          anggaran = (yearData.pajakAnggaran || 0) + (yearData.retribusiAnggaran || 0) + (yearData.pengelolaanAnggaran || 0) + (yearData.lainPadAnggaran || 0);
        }

        rows.push({
          ...yearData,
          tipe: region.tipe,
          totalRealisasi: realisasi,
          totalAnggaran: anggaran,
          capaian: anggaran > 0 ? (realisasi / anggaran) * 100 : 0,
          dataPerTahun: region.dataPerTahun,
          tahunList: region.tahunList,
        });
      });
    });
    return rows;
  }, [allData, activeMetric, subDataLookup]);

  const years = useMemo(() => [...new Set(flattened.map(d => d.tahun))].sort((a, b) => b - a), [flattened]);


  // Summary
  const summaryStats = useMemo(() => {
    const totalRel = flattened.reduce((s, d) => s + d.totalRealisasi, 0);
    const totalAng = flattened.reduce((s, d) => s + d.totalAnggaran, 0);
    const avgCapaian = flattened.length > 0 ? flattened.reduce((s, d) => s + d.capaian, 0) / flattened.length : 0;
    const highPerformers = flattened.filter(d => d.capaian >= 100).length;
    const lowPerformers = flattened.filter(d => d.capaian < 80).length;
    return { totalRel, totalAng, avgCapaian, highPerformers, lowPerformers, total: flattened.length };
  }, [flattened]);

  // Filter & Grouping logic
  const displayData = useMemo(() => {
    let result = [];
    
    if (filterYear === 'all') {
      // Aggregated view: One row per region
      result = allData.map(region => {
        const totalRealisasi = region.totalRealisasi || 0;
        const totalAnggaran = region.totalAnggaran || 0;
        return {
          daerah: region.daerah,
          tipe: region.tipe,
          tahun: '2021-2025',
          pajakRealisasi: region.totalPajak,
          retribusiRealisasi: region.totalRetribusi,
          pengelolaanRealisasi: region.totalPengelolaan,
          lainPadRealisasi: region.totalLain,
          totalRealisasi,
          totalAnggaran,
          capaian: totalAnggaran > 0 ? (totalRealisasi / totalAnggaran) * 100 : 0,
          dataPerTahun: region.dataPerTahun,
          isAggregated: true
        };
      });
    } else {
      // Detailed view: Filtered by specific year
      result = flattened.filter(d => d.tahun === parseInt(filterYear));
    }

    // Apply other filters (Search, Type, Prov)
    return result.filter(d => {
      const matchSearch = d.daerah.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = filterType === 'all' || d.tipe === filterType;
      let matchProv = true;
      if (filterProv !== 'all') {
        const kabKotaInProv = new Set(PROVINCE_KABKOTA[filterProv] || []);
        matchProv = d.daerah === filterProv || kabKotaInProv.has(d.daerah);
      }
      return matchSearch && matchType && matchProv;
    });
  }, [allData, flattened, searchTerm, filterYear, filterType, filterProv]);

  // Sort
  const sorted = useMemo(() => {
    const arr = [...displayData];
    arr.sort((a, b) => {
      let valA, valB;
      switch (sortBy) {
        case 'daerah': valA = a.daerah; valB = b.daerah; break;
        case 'tahun': valA = a.tahun; valB = b.tahun; break;
        case 'realisasi': valA = a.totalRealisasi; valB = b.totalRealisasi; break;
        case 'anggaran': valA = a.totalAnggaran; valB = b.totalAnggaran; break;
        case 'capaian': valA = a.capaian; valB = b.capaian; break;
        case 'pajak': valA = a.pajakRealisasi; valB = b.pajakRealisasi; break;
        default: valA = a.daerah; valB = b.daerah;
      }
      if (typeof valA === 'string') return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      return sortDir === 'asc' ? valA - valB : valB - valA;
    });
    return arr;
  }, [displayData, sortBy, sortDir]);

  // Pagination
  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const currentItems = sorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Trend data for overview chart
  const trendData = useMemo(() => {
    if (filterType === 'all' && searchTerm === '') {
      return years.sort().map(y => {
        const yearItems = flattened.filter(d => d.tahun === y);
        return {
          year: y.toString(),
          realisasi: yearItems.reduce((s, d) => s + d.totalRealisasi, 0),
          anggaran: yearItems.reduce((s, d) => s + d.totalAnggaran, 0),
        };
      });
    }
    return [];
  }, [flattened, years, filterType, searchTerm]);

  const handleSort = (field) => {
    if (sortBy === field) setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('desc'); }
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    const headers = ['No','Wilayah','Tipe','Tahun','Pajak Realisasi','Retribusi Realisasi','Total Anggaran','Total Realisasi','Capaian (%)'];
    const rows = sorted.map((d, i) => [
      i + 1, `"${d.daerah}"`, d.tipe, d.tahun,
      d.pajakRealisasi, d.retribusiRealisasi,
      d.totalAnggaran, d.totalRealisasi,
      d.capaian.toFixed(1)
    ]);
    const csv = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PAD_Data_${filterYear !== 'all' ? filterYear : 'AllYears'}_${filterType !== 'all' ? filterType : 'All'}.csv`;
    a.click();
  };

  const handleExportExcel = () => {
    const exportData = sorted.map((d, i) => ({
      'No': i + 1,
      'Wilayah': d.daerah,
      'Tipe': d.tipe,
      'Tahun': d.tahun,
      'Pajak (Realisasi)': d.pajakRealisasi || 0,
      'Retribusi (Realisasi)': d.retribusiRealisasi || 0,
      'Pengelolaan (Realisasi)': d.pengelolaanRealisasi || 0,
      'Lain-lalin (Realisasi)': d.lainPadRealisasi || 0,
      'Total Anggaran': d.totalAnggaran || 0,
      'Total Realisasi': d.totalRealisasi || 0,
      'Capaian (%)': d.capaian.toFixed(2)
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PAD Data");

    // Auto-width columns
    const wscols = [
      { wch: 5 },  // No
      { wch: 25 }, // Wilayah
      { wch: 15 }, // Tipe
      { wch: 10 }, // Tahun
      { wch: 20 }, // Pajak
      { wch: 20 }, // Retribusi
      { wch: 20 }, // Pengelolaan
      { wch: 20 }, // Lain-lain
      { wch: 20 }, // Anggaran
      { wch: 20 }, // Realisasi
      { wch: 12 }  // Capaian
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `PAD_Master_Data_${filterYear !== 'all' ? filterYear : 'All_Years'}.xlsx`);
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <ArrowUpDown size={11} className="ml-1 inline text-slate-300" />;
    return sortDir === 'asc' ? <SortAsc size={11} className="ml-1 inline text-brand-500" /> : <SortDesc size={11} className="ml-1 inline text-brand-500" />;
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterYear('all');
    setFilterType('all');
    setFilterProv('all');
    setSortBy('realisasi');
    setSortDir('desc');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || filterYear !== 'all' || filterType !== 'all' || filterProv !== 'all';

  return (
    <div className="space-y-6">
      
      {/* ===== SUMMARY CARDS ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Records', value: summaryStats.total.toLocaleString(), icon: Database, color: 'bg-brand-50 text-brand-600', sub: `${years.length} tahun` },
          { label: 'Total Realisasi', value: formatCurrency(summaryStats.totalRel), icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600', sub: 'Akumulasi' },
          { label: 'Total Anggaran', value: formatCurrency(summaryStats.totalAng), icon: Target, color: 'bg-blue-50 text-blue-600', sub: 'Target ditetapkan' },
          { label: 'Rata-rata Capaian', value: `${summaryStats.avgCapaian.toFixed(1)}%`, icon: Award, color: 'bg-amber-50 text-amber-600', sub: 'Average performance' },
          { label: 'Di Bawah 80%', value: `${summaryStats.lowPerformers}`, icon: AlertTriangle, color: 'bg-rose-50 text-rose-600', sub: 'Perlu perhatian' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-white p-4 rounded-2xl shadow-sm ring-1 ring-slate-100 flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${s.color} shrink-0`}>
                <s.icon size={16} />
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight">{s.label}</span>
            </div>
            <p className="text-xl font-black text-slate-900 leading-none">{s.value}</p>
            <p className="text-[9px] text-slate-400">{s.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ===== TREND OVERVIEW CHART ===== */}
      {trendData.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-slate-100">
          <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-brand-500" /> Tren PAD Seluruh Wilayah Jawa (2021-2025)
          </h3>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9 }} tickFormatter={v => v >= 1e12 ? `${(v/1e12).toFixed(1)}T` : `${(v/1e9).toFixed(0)}M`} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '11px' }} formatter={v => [formatCurrency(v)]} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                <Line type="monotone" dataKey="anggaran" name="Anggaran" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 3" dot={false} />
                <Line type="monotone" dataKey="realisasi" name="Realisasi" stroke="#1a237e" strokeWidth={3} dot={{ r: 4, fill: '#1a237e', strokeWidth: 2, stroke: 'white' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ===== MAIN TABLE CARD ===== */}
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-5 border-b border-slate-100 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                <FileSpreadsheet size={20} className="text-brand-500" /> Database Master PAD
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Menampilkan <span className="font-black text-slate-600">{sorted.length.toLocaleString()}</span> dari <span className="font-black">{flattened.length.toLocaleString()}</span> rekaman data
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={handleExportExcel} 
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
              >
                <FileSpreadsheet size={13} /> Excel
              </button>
              <button 
                onClick={handleExportCSV} 
                className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-white rounded-xl text-xs font-black hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/20"
              >
                <Download size={13} /> CSV
              </button>
              {hasActiveFilters && (
                <button onClick={resetFilters} className="flex items-center gap-1.5 px-3 py-2.5 bg-rose-50 text-rose-600 rounded-xl text-xs font-black hover:bg-rose-100 transition-all">
                  <RefreshCw size={12} /> Reset Filter
                </button>
              )}
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input
                type="text"
                placeholder="Cari daerah..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-9 pr-4 py-2.5 bg-slate-50 rounded-xl ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 text-xs font-bold outline-none transition-all w-48"
              />
              {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={12} /></button>}
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <select
                value={filterYear}
                onChange={(e) => { setFilterYear(e.target.value); setCurrentPage(1); }}
                className="pl-9 pr-7 py-2.5 bg-slate-50 rounded-xl ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 text-xs font-bold outline-none appearance-none cursor-pointer"
              >
                <option value="all">Semua Tahun</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <select
                value={filterProv}
                onChange={(e) => { setFilterProv(e.target.value); setCurrentPage(1); }}
                className="pl-9 pr-7 py-2.5 bg-slate-50 rounded-xl ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 text-xs font-bold outline-none appearance-none cursor-pointer"
              >
                <option value="all">Semua Provinsi</option>
                {Object.keys(PROVINCE_KABKOTA).sort().map(p => (
                  <option key={p} value={p}>{p.replace('Prov. ', '')}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <select
                value={filterType}
                onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
                className="pl-9 pr-7 py-2.5 bg-slate-50 rounded-xl ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500 text-xs font-bold outline-none appearance-none cursor-pointer"
              >
                <option value="all">Semua Tipe</option>
                <option value="Provinsi">Provinsi</option>
                <option value="Kabupaten">Kabupaten</option>
                <option value="Kota">Kota</option>
              </select>
            </div>

            {hasActiveFilters && (
              <div className="flex items-center gap-1 px-3 py-2 bg-brand-50 text-brand-600 rounded-xl text-[10px] font-black uppercase tracking-wider">
                <Filter size={11} /> Filter Aktif
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gradient-to-r from-slate-800 to-brand-900 text-white text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-4 py-3.5 w-10 text-center font-black">#</th>
                <th className="px-4 py-3.5 font-black cursor-pointer hover:text-brand-200 transition-colors" onClick={() => handleSort('daerah')}>
                  Wilayah <SortIcon field="daerah" />
                </th>
                <th className="px-4 py-3.5 font-black text-center cursor-pointer hover:text-brand-200" onClick={() => handleSort('tahun')}>
                  Tahun <SortIcon field="tahun" />
                </th>
                <th className="px-4 py-3.5 font-black cursor-pointer hover:text-brand-200 hidden md:table-cell" onClick={() => handleSort('pajak')}>
                  Pajak <SortIcon field="pajak" />
                </th>
                <th className="px-4 py-3.5 font-black hidden lg:table-cell">Retribusi</th>
                <th className="px-4 py-3.5 font-black hidden lg:table-cell">Pengelolaan</th>
                <th className="px-4 py-3.5 font-black hidden xl:table-cell">Lain-lain</th>
                <th className="px-4 py-3.5 font-black cursor-pointer hover:text-brand-200" onClick={() => handleSort('anggaran')}>
                  Anggaran {metricLabel !== 'PAD Total' && <span className="text-[8px] opacity-70 block">{metricLabel}</span>} <SortIcon field="anggaran" />
                </th>
                <th className="px-4 py-3.5 font-black cursor-pointer hover:text-brand-200" onClick={() => handleSort('realisasi')}>
                  Realisasi {metricLabel !== 'PAD Total' && <span className="text-[8px] opacity-70 block">{metricLabel}</span>} <SortIcon field="realisasi" />
                </th>
                <th className="px-4 py-3.5 font-black cursor-pointer hover:text-brand-200" onClick={() => handleSort('capaian')}>
                  Capaian <SortIcon field="capaian" />
                </th>
                <th className="px-4 py-3.5 font-black text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence>
                {currentItems.map((item, idx) => {
                  const globalIdx = (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;
                  const isExpanded = expandedRow === `${item.daerah}-${item.tahun}`;
                  const key = `${item.daerah}-${item.tahun}`;
                  
                  return (
                    <React.Fragment key={key}>
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.015 }}
                        className={`transition-colors group hover:bg-brand-50/40 ${isExpanded ? 'bg-brand-50/30' : ''}`}
                      >
                        <td className="px-4 py-3 text-center text-slate-300 font-black text-xs">{globalIdx}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-[9px] font-black shrink-0 shadow-sm ${
                              item.tipe === 'Provinsi' ? 'bg-brand-500' :
                              item.tipe === 'Kota' ? 'bg-blue-600' : 'bg-emerald-600'
                            }`}>
                              {item.tipe === 'Provinsi' ? 'P' : item.tipe === 'Kota' ? 'K' : 'Kb'}
                            </div>
                            <div>
                              <p className="font-black text-slate-900 text-xs uppercase leading-tight line-clamp-1">{item.daerah}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{item.tipe}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2.5 py-1 bg-brand-50 text-brand-700 rounded-lg font-black text-[10px]">{item.tahun}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-semibold text-[11px] hidden md:table-cell">
                          {formatCurrency(item.pajakRealisasi)}
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-semibold text-[11px] hidden lg:table-cell">
                          {formatCurrency(item.retribusiRealisasi)}
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-semibold text-[11px] hidden lg:table-cell">
                          {formatCurrency(item.pengelolaanRealisasi)}
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-semibold text-[11px] hidden xl:table-cell">
                          {formatCurrency(item.lainPadRealisasi)}
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-bold text-xs">
                          {formatCurrency(item.totalAnggaran)}
                        </td>
                        <td className="px-4 py-3 text-slate-900 font-black text-sm">
                          {formatCurrency(item.totalRealisasi)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-grow h-2 bg-slate-100 rounded-full overflow-hidden min-w-[50px]">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, item.capaian)}%` }}
                                transition={{ delay: idx * 0.015, duration: 0.5 }}
                                className={`h-full rounded-full ${
                                  item.capaian >= 100 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                                  item.capaian >= 80 ? 'bg-gradient-to-r from-brand-400 to-brand-500' :
                                  'bg-gradient-to-r from-amber-400 to-rose-400'
                                }`}
                              />
                            </div>
                            <span className={`text-[10px] font-black min-w-[40px] text-right ${
                              item.capaian >= 100 ? 'text-emerald-600' :
                              item.capaian >= 80 ? 'text-brand-600' : 'text-rose-500'
                            }`}>
                              {item.capaian.toFixed(1)}%
                            </span>
                            {item.capaian >= 100 && <Award size={12} className="text-emerald-500 shrink-0" />}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center gap-1.5 justify-center">
                            {onRegionClick && (
                              <button
                                onClick={() => {
                                  const regionObj = {
                                    ...item,
                                    daerah: item.daerah,
                                    tipe: item.tipe,
                                    dataPerTahun: item.dataPerTahun,
                                    tahunList: item.tahunList,
                                  };
                                  onRegionClick(regionObj);
                                }}
                                className="p-1.5 bg-brand-50 text-brand-500 rounded-lg hover:bg-brand-100 hover:text-brand-700 transition-all"
                                title="Lihat Detail"
                              >
                                <Eye size={13} />
                              </button>
                            )}
                            <button
                              onClick={() => setExpandedRow(isExpanded ? null : key)}
                              className={`p-1.5 rounded-lg transition-all ${isExpanded ? 'bg-slate-200 text-slate-600' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                              title="Expand Komponen"
                            >
                              {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </button>
                          </div>
                        </td>
                      </motion.tr>

                      {/* EXPANDED ROW with mini bar chart */}
                      {isExpanded && (
                        <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <td colSpan={11} className="px-4 py-0">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: 'auto' }}
                              exit={{ height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="py-4 px-2 bg-brand-50/30 rounded-2xl mb-3 space-y-4">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Breakdown Komponen — {item.daerah} ({item.tahun})</p>
                                
                                {/* 4 component bars */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                  {[
                                    { label: 'Pajak', anggaran: item.pajakAnggaran, realisasi: item.pajakRealisasi, color: 'bg-indigo-500', textColor: 'text-indigo-600' },
                                    { label: 'Retribusi', anggaran: item.retribusiAnggaran, realisasi: item.retribusiRealisasi, color: 'bg-emerald-500', textColor: 'text-emerald-600' },
                                    { label: 'Pengelolaan', anggaran: item.pengelolaanAnggaran, realisasi: item.pengelolaanRealisasi, color: 'bg-blue-500', textColor: 'text-blue-600' },
                                    { label: 'Lain-lain', anggaran: item.lainPadAnggaran, realisasi: item.lainPadRealisasi, color: 'bg-amber-500', textColor: 'text-amber-600' },
                                  ].map((comp, i) => {
                                    const pct = comp.anggaran > 0 ? Math.min(100, (comp.realisasi / comp.anggaran) * 100) : 0;
                                    return (
                                      <div key={i} className="bg-white rounded-xl p-3 ring-1 ring-slate-100">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-[10px] font-black text-slate-600 uppercase">{comp.label}</span>
                                          <span className={`text-[10px] font-black ${pct >= 100 ? 'text-emerald-500' : comp.textColor}`}>{pct.toFixed(0)}%</span>
                                        </div>
                                        <p className="text-sm font-black text-slate-900 mb-1">{formatCurrency(comp.realisasi)}</p>
                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className={`h-full rounded-full ${comp.color}`} />
                                        </div>
                                        <p className="text-[9px] text-slate-400 mt-1">Target: {formatCurrency(comp.anggaran)}</p>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Mini trend if multi-year available */}
                                {item.dataPerTahun && item.dataPerTahun.length > 1 && (
                                  <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Tren Realisasi PAD</p>
                                    <div className="h-[80px] bg-white rounded-xl p-2 ring-1 ring-slate-100">
                                      <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={[...item.dataPerTahun].sort((a,b) => a.tahun - b.tahun).map(d => ({
                                          year: d.tahun.toString(),
                                          val: d.pajakRealisasi + d.retribusiRealisasi + d.pengelolaanRealisasi + d.lainPadRealisasi
                                        }))}>
                                          <XAxis dataKey="year" hide />
                                          <YAxis hide />
                                          <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', fontSize: '10px' }} formatter={v => [formatCurrency(v), 'PAD']} />
                                          <Bar dataKey="val" radius={[4,4,0,0]}>
                                            {item.dataPerTahun.map((d, i) => (
                                              <Cell key={i} fill={d.tahun === item.tahun ? '#1a237e' : '#e2e8f0'} />
                                            ))}
                                          </Bar>
                                        </BarChart>
                                      </ResponsiveContainer>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          </td>
                        </motion.tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>

          {sorted.length === 0 && (
            <div className="py-20 text-center">
              <Database size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-bold">Tidak ada data yang cocok</p>
              <button onClick={resetFilters} className="mt-4 text-brand-500 text-sm font-black hover:underline">Reset filter</button>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-400 text-xs font-bold">
            Hal {currentPage} dari {totalPages} · {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, sorted.length)} dari {sorted.length.toLocaleString()} record
          </p>
          <div className="flex items-center gap-1.5">
            <button disabled={currentPage <= 1} onClick={() => setCurrentPage(1)}
              className="px-3 py-2 rounded-xl bg-slate-50 text-slate-400 disabled:opacity-30 hover:bg-slate-100 text-xs font-bold transition-all">
              First
            </button>
            <button disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}
              className="p-2 rounded-xl bg-slate-50 text-slate-400 disabled:opacity-30 hover:bg-slate-100 transition-all">
              <ChevronLeft size={16} />
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page;
                if (totalPages <= 5) page = i + 1;
                else if (currentPage <= 3) page = i + 1;
                else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                else page = currentPage - 2 + i;
                return (
                  <button key={page} onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${
                      currentPage === page ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}>
                    {page}
                  </button>
                );
              })}
            </div>
            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}
              className="p-2 rounded-xl bg-slate-50 text-slate-400 disabled:opacity-30 hover:bg-slate-100 transition-all">
              <ChevronRight size={16} />
            </button>
            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(totalPages)}
              className="px-3 py-2 rounded-xl bg-slate-50 text-slate-400 disabled:opacity-30 hover:bg-slate-100 text-xs font-bold transition-all">
              Last
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataMaster;

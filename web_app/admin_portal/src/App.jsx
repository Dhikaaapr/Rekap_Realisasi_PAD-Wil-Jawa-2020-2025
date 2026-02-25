import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Database, 
  MapPin, 
  Calendar, 
  Search, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  LayoutDashboard,
  Settings,
  ChevronRight,
  TrendingUp,
  Zap,
  ShieldCheck,
  Globe,
  ArrowUpRight,
  Sparkles,
  Target,
  BarChart3,
  Edit3,
  Check,
  History,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  fetchAllRegions, 
  fetchPadYears, 
  fetchDetailForEdit, 
  updateDetailRow,
  upsertDetailRows,
  syncPadTotals 
} from './lib/supabase';
import { ProvinsiForm, KabKotaForm, RetribusiForm } from './components/AdminForms';
import Login from './components/Login';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    maximumFractionDigits: 0 
  }).format(val || 0);
};

const recalculateTree = (data) => {
  const rows = data.map(d => ({ ...d }));
  const map = {};
  rows.forEach(r => map[r.kategori_kode] = r);
  
  // 1. Reset Parents and Mark
  rows.forEach(r => {
      const isParent = rows.some(child => child.kategori_kode.startsWith(r.kategori_kode + '.') && child.kategori_kode !== r.kategori_kode);
      r.isParent = isParent;
      if (isParent) {
          r.anggaran = 0;
          r.realisasi = 0;
      }
  });

  // 2. Aggregate
  // We need to process from deep to shallow. Sort by length of code desc.
  // Actually, sorting by code usually puts 4.1.1.1 after 4.1.1.
  // So reverse iteration works IF standard string sort is used.
  rows.sort((a, b) => a.kategori_kode.localeCompare(b.kategori_kode));
  
  for (let i = rows.length - 1; i >= 0; i--) {
     const node = rows[i];
     // Find parent
     let parts = node.kategori_kode.split('.');
     while (parts.length > 1) {
         parts.pop();
         const pCode = parts.join('.');
         if (map[pCode]) {
             const parent = map[pCode];
             parent.anggaran = (parent.anggaran || 0) + (node.anggaran || 0);
             parent.realisasi = (parent.realisasi || 0) + (node.realisasi || 0);
             break; // Add to immediate parent only. The parent will add to its parent.
         }
     }
  }
  return rows;
};

// --- COMPONENTS ---

const Sidebar = ({ activeTab, setActiveTab, user, onLogout }) => {
  const links = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Integrasi Dashboard' },
    { id: 'entry', icon: Edit3, label: 'Input Data PAD' },
  ];

  return (
    <div className="admin-sidebar shadow-xl">
      <div className="sidebar-header">
        <div className="flex items-center gap-3 py-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center text-white shadow-lg">
            <Zap size={22} fill="white" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tighter text-slate-900 uppercase italic">PAD<span className="text-blue-600">ADMIN</span></h1>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] block -mt-1">{user?.daerah || 'Verifikasi Data'}</span>
          </div>
        </div>
      </div>

      <nav className="mt-4 flex-1">
        {links.map((link) => (
          <button
            key={link.id}
            onClick={() => setActiveTab(link.id)}
            className={`sidebar-link ${activeTab === link.id ? 'active' : ''}`}
          >
            <link.icon size={18} />
            <span className="text-[10px] uppercase font-black tracking-widest">{link.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 space-y-4">
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-3 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 transition-all group"
        >
          <ArrowRight size={16} />
          <span className="text-[10px] uppercase font-black tracking-widest">Logout System</span>
        </button>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
               <h4 className="text-[8px] font-black text-slate-800 uppercase">Cloud Sync</h4>
            </div>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">Established</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('admin_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState('entry');
  const [regions, setRegions] = useState([]);
  const [years, setYears] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [adminMode, setAdminMode] = useState('standard'); // 'standard', 'provinsi', 'kabkota'
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [dirtyRows, setDirtyRows] = useState(new Set());

  const handleLogout = () => {
    localStorage.removeItem('admin_user');
    setUser(null);
  };

  // Init Data
  useEffect(() => {
    if (!user) return;
    const init = async () => {
      try {
        const [r, y] = await Promise.all([fetchAllRegions(), fetchPadYears()]);
        setRegions(r);
        const combinedYears = [...new Set([...y, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030])].sort((a, b) => b - a);
        setYears(combinedYears);
        
        // Locked to user region
        setSelectedRegion(user.daerah);
        setSelectedYear(2024);
      } catch (err) {
        showStatus('error', 'SYSTEM GLITCH: Could not establish secure link.');
      }
    };
    init();
  }, [user]);

  // Fetch Logic
  const loadData = useCallback(async () => {
    if (!selectedRegion || !selectedYear) return;
    setLoading(true);
    setDirtyRows(new Set());
    try {
      const data = await fetchDetailForEdit(selectedRegion, selectedYear);
      // Determine parents initially or recalc
      const processed = recalculateTree(data);
      setDetails(processed);
    } catch (err) {
      showStatus('error', 'ACCESS REFUSED: Database did not respond.');
    } finally {
      setLoading(false);
    }
  }, [selectedRegion, selectedYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showStatus = (type, message) => {
    setStatus({ type, message });
    setTimeout(() => setStatus({ type: '', message: '' }), 4000);
  };

  const handleUpdate = async (id, field, value) => {
    const numValue = parseFloat(value) || 0;
    setDirtyRows(prev => new Set(prev).add(id));
    
    // Optimistic Update with Recalc
    setDetails(prev => {
        const next = prev.map(d => d.id === id ? { ...d, [field]: numValue } : d);
        return recalculateTree(next);
    });
    
    try {
      await updateDetailRow(id, { [field]: numValue });
      setTimeout(() => {
        setDirtyRows(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 1500);
    } catch (err) {
      showStatus('error', 'DATA LOSS: Failed to write to cloud.');
    }
  };

  const handleSync = async () => {
    setSaving(true);
    try {
      // 1. Save ALL derived calculations (parents) to DB
      await upsertDetailRows(details);
      
      // 2. Sync Stats
      await syncPadTotals(selectedRegion, selectedYear);
      showStatus('success', 'LETS GOOO! Dashboard Live Updated');
    } catch (err) {
      console.error(err);
      showStatus('error', 'SYNC CRASH: Internal Server Error.');
    } finally {
      setSaving(false);
    }
  };

  const isProvinsi = useMemo(() => {
    if (!selectedRegion) return false;
    const lower = selectedRegion.toLowerCase();
    // Provinces identified by prefix or exact special region name
    return lower.startsWith('prov.') || lower === 'dki jakarta' || lower === 'di yogyakarta';
  }, [selectedRegion]);

  const filteredData = useMemo(() => {
    if (!details.length) return [];
    
    // Exact lists from UU HKPD + common DB variants
    const KAB_KOTA_ONLY_KEYWORDS = [
      'PBB-P2', 'PBBP2', 'BUMI DAN BANGUNAN', 'BPHTB', 'PEROLEHAN HAK', 'PBJT', 
      'BARANG DAN JASA TERTENTU', 'REKLAME', 'AIR TANAH', 'PAT', 'MBLB', 
      'MINERAL BUKAN LOGAM', 'WALET', 'SARANG BURUNG', 'OPSEN PKB', 'OPSEN BBNKB'
    ];

    const PROV_ONLY_KEYWORDS = [
      'PKB', 'BBNKB', 'ALAT BERAT', 'PAB', 'PBBKB', 'BAHAN BAKAR', 'AIR PERMUKAAN', 
      'PAP', 'ROKOK', 'OPSEN MBLB', 'KENDARAAN BERMOTOR'
    ];

    let baseData = details.filter(row => {
      const name = (row.ref_kategori_pad?.nama || row.kategori_kode || '').toUpperCase();
      
      if (isProvinsi) {
        // PROVINCE VIEW:
        // Must EXCLUDE Kab/Kota taxes (PBB-P2, BPHTB, PBJT, PAT, MBLB, Walet, Opsen PKB, Opsen BBNKB)
        // Exception: Name might match 'MBLB' but actually be 'Opsen Pajak MBLB' (which IS Provincial)
        const matchesKab = KAB_KOTA_ONLY_KEYWORDS.some(k => name.includes(k));
        if (matchesKab && !name.includes('OPSEN MBLB')) return false;
        
        return true;
      } else {
        // KAB/KOTA VIEW:
        // Must EXCLUDE Provincial taxes (PKB, BBNKB, PAB, PBBKB, PAP, Rokok, Opsen MBLB)
        // Exception: Name might match 'PKB' or 'BBNKB' but actually be 'Opsen PKB' (which IS Kab/Kota)
        const matchesProv = PROV_ONLY_KEYWORDS.some(k => name.includes(k));
        if (matchesProv && !name.includes('OPSEN PKB') && !name.includes('OPSEN BBNKB')) return false;

        // Special exclusion: Opsen MBLB is Provincial revenue
        if (name.includes('OPSEN MBLB')) return false;

        return true;
      }
    });

    if (!searchTerm) return baseData;
    const lower = searchTerm.toLowerCase();
    return baseData.filter(d => 
      (d.ref_kategori_pad?.nama || d.kategori_kode || '').toLowerCase().includes(lower)
    );
  }, [details, searchTerm, isProvinsi]);


  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { label: 'Cakupan Wilayah', value: regions.length, sub: 'Jawa & DIY', icon: Globe, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Tahun Anggaran', value: years.length, sub: '2021 - 2030', icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { label: 'Status Server', value: 'Online', sub: 'Latency: 42ms', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                ].map((stat, i) => (
                  <div key={i} className="stat-card p-10 h-full group hover:border-blue-400">
                    <div className="stat-card-glow" />
                    <div className="relative z-10 text-center">
                       <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mx-auto mb-6 shadow-sm`}>
                         <stat.icon size={28} />
                       </div>
                       <h3 className="text-3xl font-black text-slate-900 mb-1 uppercase italic">{stat.value}</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.label}</p>
                       <span className="text-[9px] font-bold text-slate-300 uppercase mt-2 block tracking-widest">{stat.sub}</span>
                    </div>
                  </div>
                ))}
             </div>

             <div className="bg-white border border-slate-200 p-12 rounded-[3.5rem] relative overflow-hidden shadow-sm">
                <div className="flex items-center gap-8 mb-12">
                  <div className="w-16 h-16 rounded-3xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/20">
                    <Sparkles size={32} />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Selamat Datang di Portal Admin</h4>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Authorized Personal Only • Regional Integrated System</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100">
                      <h5 className="text-[11px] font-black text-slate-900 uppercase italic mb-6 flex items-center gap-3">
                        <Target size={18} className="text-blue-600" /> Tahapan Pengisian:
                      </h5>
                      <ul className="space-y-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                        <li className="flex items-center gap-4 bg-white/50 p-4 rounded-xl border border-slate-100"><ChevronRight size={14} className="text-blue-500" /> Wilayah dikunci berdasarkan akun admin</li>
                        <li className="flex items-center gap-4 bg-white/50 p-4 rounded-xl border border-slate-100"><ChevronRight size={14} className="text-blue-500" /> Pilih Tahun Anggaran yang sesuai</li>
                        <li className="flex items-center gap-4 bg-white/50 p-4 rounded-xl border border-slate-100"><ChevronRight size={14} className="text-blue-500" /> Isi Anggaran & Realisasi Pajak per baris</li>
                        <li className="flex items-center gap-4 bg-white/50 p-4 rounded-xl border border-slate-100"><ChevronRight size={14} className="text-blue-500" /> Klik "Push Update" untuk mempublikasikan data</li>
                      </ul>
                   </div>
                   <div className="p-8 rounded-[2rem] bg-indigo-50/30 border border-indigo-100 relative overflow-hidden">
                      <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full" />
                      <h5 className="text-[11px] font-black text-slate-900 uppercase italic mb-6 flex items-center gap-3">
                        <ShieldCheck size={18} className="text-indigo-600" /> Protokol Keamanan Data:
                      </h5>
                      <p className="text-[11px] font-bold text-slate-500 uppercase leading-relaxed tracking-wider mb-6">
                        Setiap perubahan data akan langsung tersinkronisasi dengan Dashboard Publik secara real-time.
                      </p>
                      <div className="p-5 rounded-2xl bg-white/80 border border-indigo-100 shadow-sm">
                        <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed">
                          Pastikan data yang dimasukkan telah sesuai dengan Laporan Realisasi Anggaran (LRA) resmi yang telah diaudit atau divalidasi oleh otoritas keuangan daerah.
                        </p>
                      </div>
                   </div>
                </div>
             </div>
          </motion.div>
        );
      case 'entry':
      default:
        return (
          <>
            <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                  <Edit3 size={24} />
                </div>
                <div>
                   <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Entri Data PAD</h2>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Status: <span className="text-blue-600">{selectedRegion}</span></p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                    <button 
                      onClick={() => setAdminMode('standard')}
                      className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${adminMode === 'standard' ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
                    >Manual Grid</button>
                    <button 
                      onClick={() => setAdminMode('form')}
                      className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${adminMode === 'form' ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
                    >Smart Form</button>
                 </div>
                 
                 {adminMode === 'standard' && (
                    <button onClick={handleSync} disabled={saving} className="btn-primary flex items-center gap-3">
                       {saving ? <RefreshCw className="animate-spin" size={14} /> : <Zap size={14} fill="white" />}
                       <span className="text-[9px]">Push Update</span>
                    </button>
                 )}
              </div>
            </header>

            {/* SELECTION ENGINE */}
            <section className="bg-white border border-slate-200 p-8 rounded-[2.5rem] mb-10 shadow-sm">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-end">
                  <div className="lg:col-span-5 space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 italic">Wilayah Operasional</label>
                    <div className="relative">
                      <div className="absolute left-0 top-0 bottom-0 w-14 flex items-center justify-center pointer-events-none z-10">
                        <MapPin size={18} className="text-blue-600" />
                      </div>
                      <select 
                        value={selectedRegion} 
                        onChange={(e) => setSelectedRegion(e.target.value)} 
                        disabled
                        className="neo-input w-full !pl-14 opacity-60 cursor-not-allowed bg-slate-50"
                      >
                        <option value={selectedRegion}>{selectedRegion}</option>
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2">
                        <ShieldCheck size={16} className="text-emerald-500" />
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-3 space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 italic">Tahun Anggaran</label>
                    <div className="relative">
                      <div className="absolute left-0 top-0 bottom-0 w-14 flex items-center justify-center pointer-events-none z-10">
                        <Calendar size={18} className="text-slate-400" />
                      </div>
                      <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="neo-input w-full !pl-14">
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="lg:col-span-3 space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 italic">Cari Komponen</label>
                    <div className="relative">
                      <div className="absolute left-0 top-0 bottom-0 w-14 flex items-center justify-center pointer-events-none z-10">
                        <Search size={18} className="text-slate-400" />
                      </div>
                      <input type="text" placeholder="Filter kode atau nama..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="neo-input w-full !pl-14 pr-6" />
                    </div>
                  </div>

                  <div className="lg:col-span-1 flex justify-end">
                    <button onClick={loadData} className="w-14 h-14 bg-slate-100 hover:bg-slate-200 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-600 transition-all group shadow-sm">
                       <RefreshCw size={20} className={`group-hover:text-blue-600 transition-colors ${loading ? 'animate-spin text-blue-600' : 'opacity-40'}`} />
                    </button>
                  </div>
               </div>
            </section>

            {adminMode === 'form' ? (
                isProvinsi ? (
                   <ProvinsiForm region={selectedRegion} year={selectedYear} onSave={() => showStatus('success', 'Data Pajak Provinsi Tersimpan')} />
                ) : (
                   <div className="space-y-10">
                      <KabKotaForm region={selectedRegion} year={selectedYear} onSave={() => showStatus('success', 'Data Pajak Daerah Tersimpan')} />
                      <RetribusiForm region={selectedRegion} year={selectedYear} onSave={() => showStatus('success', 'Data Retribusi Tersimpan')} />
                   </div>
                )
            ) : (
                <>
                {/* ANALYTIC WIDGETS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="stat-card p-8 flex flex-col justify-between h-40 group">
                <div className="stat-card-glow" />
                <div className="relative">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Total Components</span>
                   <h3 className="text-4xl font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase italic">{details.length}</h3>
                 </div>
                 <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                   <LayoutDashboard size={14} className="text-blue-500" /> Structure Operational
                 </div>
              </div>

              <div className="stat-card p-8 h-40 flex flex-col justify-between group">
                <div className="stat-card-glow bg-emerald-500/10" />
                 <div className="relative">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Real-time Pipeline</span>
                   <h3 className="text-4xl font-black text-emerald-600 uppercase italic">Active</h3>
                 </div>
                 <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                   <Globe size={14} className="text-emerald-500" /> Node JS Backend
                 </div>
              </div>

              <div className="stat-card p-8 h-40 flex flex-col justify-between group">
                <div className="stat-card-glow bg-blue-500/10" />
                 <div className="relative">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Data Coverage</span>
                   <h3 className="text-4xl font-black text-slate-900 uppercase italic">JAWA</h3>
                 </div>
                 <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                   <MapPin size={14} className="text-rose-500" /> Regional Scope
                 </div>
              </div>
            </div>

            {/* THE GRID (DATA TABLE) */}
            <section className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
              <div className="max-h-[800px] overflow-auto custom-scrollbar">
                <table className="w-full border-collapse">
                   <thead className="sticky top-0 z-30 shadow-sm">
                    <tr className="bg-slate-50 backdrop-blur-md border-b border-slate-200">
                      <th className="p-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 text-left w-24">ID</th>
                      <th className="p-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 text-left">Nomenclature Definition</th>
                      <th className="p-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 text-right w-64">Fiscal Target</th>
                      <th className="p-6 text-[11px] font-black uppercase tracking-[0.2em] text-blue-600 text-right w-64">Actual Realization</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <AnimatePresence mode="popLayout">
                      {loading ? (
                        <tr><td colSpan="4" className="p-40 text-center">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6">
                               <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin" />
                               <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Establishing Secure Uplink...</p>
                            </motion.div>
                        </td></tr>
                      ) : filteredData.length === 0 ? (
                        <tr><td colSpan="4" className="p-40 text-center">
                            <div className="max-w-md mx-auto space-y-4 opacity-30">
                              <AlertCircle size={64} className="mx-auto text-slate-400" />
                              <h4 className="text-xl font-black uppercase tracking-widest italic text-slate-800">Zero Records Detected</h4>
                              <p className="text-[10px] font-bold uppercase leading-relaxed tracking-widest text-slate-500">Internal structure scan failed for this regional parameters. Ensure the region has been propagated with the LRA template.</p>
                            </div>
                        </td></tr>
                      ) : filteredData.map((row) => {
                        const isParent = row.isParent;
                        const isDirty = dirtyRows.has(row.id);

                        return (
                          <motion.tr 
                            layout
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            key={row.id} 
                            className={`tr-hover ${isParent ? 'bg-slate-50/50' : ''}`}
                          >
                            <td className="p-6 text-left">
                               <div className="flex items-center gap-3">
                                  <div className={`w-1.5 h-1.5 rounded-full ${isParent ? 'bg-blue-600' : 'bg-slate-300'}`} />
                                  <span className="text-[10px] font-bold font-mono text-slate-400">{row.kategori_kode}</span>
                               </div>
                            </td>
                            <td className="p-6">
                               <div className="flex flex-col gap-1">
                                  <span className={`text-[12px] font-black uppercase tracking-tight ${isParent ? 'text-slate-900 font-black' : 'text-slate-600 font-bold'}`}>
                                    {row.ref_kategori_pad?.nama || row.kategori_kode}
                                  </span>
                                  {isParent && <span className="text-[9px] font-bold text-blue-600/50 uppercase tracking-widest">Aggregate Category</span>}
                                </div>
                            </td>
                            <td className="p-6 text-right">
                              {isParent ? (
                                <span className="text-[13px] font-black text-slate-500 font-mono tracking-tighter tabular-nums px-4">{formatCurrency(row.anggaran)}</span>
                              ) : (
                                <div className="relative flex justify-end group/input">
                                    <input 
                                        type="number"
                                        defaultValue={row.anggaran}
                                        onBlur={(e) => handleUpdate(row.id, 'anggaran', e.target.value)}
                                        className={`data-table-input max-w-[200px] text-slate-600 ${isDirty ? 'border-blue-500 bg-blue-50' : ''}`}
                                    />
                                </div>
                              )}
                            </td>
                            <td className="p-6 text-right">
                              {isParent ? (
                                <span className="text-[15px] font-black text-slate-900 font-mono tracking-tighter tabular-nums px-4">{formatCurrency(row.realisasi)}</span>
                              ) : (
                                <div className="relative flex justify-end group/input">
                                    <input 
                                        type="number"
                                        defaultValue={row.realisasi}
                                        onBlur={(e) => handleUpdate(row.id, 'realisasi', e.target.value)}
                                        className={`data-table-input max-w-[200px] !text-blue-700 !border-blue-200 ${isDirty ? 'border-blue-500 bg-blue-50' : ''}`}
                                    />
                                    {isDirty && (
                                        <div className="absolute -top-1 -right-1 flex gap-1">
                                             <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
                                             <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                        </div>
                                    )}
                                </div>
                              )}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              <div className="p-8 bg-slate-50 flex items-center justify-between border-t border-slate-200">
                 <div className="flex items-center gap-10">
                     <div className="flex flex-col gap-1">
                       <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">Stream Status</span>
                       <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                         <span className="text-[9px] font-black text-emerald-500 uppercase">Live Pipeline</span>
                       </div>
                     </div>
                    <div className="flex items-center gap-3 max-w-lg">
                      <Info size={16} className="text-blue-600 shrink-0" />
                      <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-widest italic">
                        Records are dynamically linked to Supabase Mainnet. Aggregate summaries must be manually pushed to the Live Dashboard system.
                      </p>
                    </div>
                 </div>
                   <div className="text-right">
                      <span className="text-[10px] font-black text-slate-800 uppercase tracking-[0.3em]">Total Rows: {filteredData.length}</span>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Database Region: WEST-JAWA-1</p>
                   </div>
               </div>
            </section>
                </>
            )}
          </>
        );
    }
  };

  if (!user) return <Login onLogin={setUser} />;

  return (
    <div className="flex font-sans tracking-tight bg-[#f8fafc] text-slate-900">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={handleLogout} />

      <main className="flex-1 ml-64 p-8 min-h-screen pb-24">
        {renderContent()}
      </main>

      {/* FOOTER STATUS BAR */}
      <footer className="fixed bottom-0 left-64 right-0 h-8 glass-nav z-[150] flex items-center px-8 justify-between">
          <div className="flex items-center gap-6">
             <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Protocol: HTTPS-v4</span>
             <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Latency: 42ms</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-1 h-1 rounded-full bg-slate-800" />
             <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">© 2026 enterprise system</span>
          </div>
      </footer>

      {/* NOTIFICATION CENTER */}
       <AnimatePresence>
        {status.message && (
          <motion.div 
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`fixed top-12 right-10 z-[300] p-8 rounded-[2.5rem] bg-white border border-slate-200 shadow-2xl flex items-center gap-6`}
          >
            <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center ${status.type === 'error' ? 'bg-rose-50 text-rose-500 border border-rose-100' : 'bg-emerald-50 text-emerald-500 border border-emerald-100'}`}>
              {status.type === 'error' ? <AlertCircle size={32} /> : <CheckCircle2 size={32} />}
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-900 uppercase italic tracking-widest mb-1">{status.type === 'success' ? 'Protocol Executed' : 'System Anomaly'}</p>
              <p className="text-[10px] font-bold text-slate-400 max-w-xs uppercase leading-tight tracking-wider">{status.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

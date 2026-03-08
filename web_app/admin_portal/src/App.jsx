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
  const [status, setStatus] = useState({ type: '', message: '' });

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
        
        // Locked to user region unless superadmin
        if (user.role === 'superadmin' || !user.daerah) {
          setSelectedRegion(r[0] || 'Prov. Jawa Barat');
        } else {
          setSelectedRegion(user.daerah);
        }
        setSelectedYear(2024);
      } catch (err) {
        showStatus('error', 'SYSTEM GLITCH: Could not establish secure link.');
      }
    };
    init();
  }, [user]);

  const showStatus = (type, message) => {
    setStatus({ type, message });
    setTimeout(() => setStatus({ type: '', message: '' }), 4000);
  };

  const isProvinsi = useMemo(() => {
    if (!selectedRegion) return false;
    const lower = selectedRegion.toLowerCase();
    return lower.includes('prov') || lower.includes('dki jakarta') || lower.includes('di yogyakarta');
  }, [selectedRegion]);

  // The `filteredData` and related logic (KAB_KOTA_ONLY_KEYWORDS, PROV_ONLY_KEYWORDS)
  // are removed as they are not used in the new structure.

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
                        <li className="flex items-center gap-4 bg-white/50 p-4 rounded-xl border border-slate-100"><ChevronRight size={14} className="text-blue-500" /> Isi Anggaran & Realisasi Pendapatan</li>
                        <li className="flex items-center gap-4 bg-white/50 p-4 rounded-xl border border-slate-100"><ChevronRight size={14} className="text-blue-500" /> Klik "Simpan Data" di Form untuk mengupdate</li>
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
                 {/* Logout button moved to sidebar */}
              </div>
            </header>

            {/* SELECTION ENGINE */}
            <section className="bg-white border border-slate-200 p-8 rounded-[2.5rem] mb-10 shadow-sm">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-end">
                  <div className="lg:col-span-6 space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 italic">Wilayah Operasional</label>
                    <div className="relative">
                      <div className="absolute left-0 top-0 bottom-0 w-14 flex items-center justify-center pointer-events-none z-10">
                        <MapPin size={18} className="text-blue-600" />
                      </div>
                      <select 
                        value={selectedRegion} 
                        onChange={(e) => setSelectedRegion(e.target.value)} 
                        disabled={user?.role !== 'superadmin' && !!user?.daerah}
                        className={`neo-input w-full !pl-14 ${user?.role !== 'superadmin' && !!user?.daerah ? 'opacity-60 cursor-not-allowed bg-slate-50' : 'bg-white text-slate-700'}`}
                      >
                        {user?.role === 'superadmin' || !user?.daerah ? (
                          regions.map(r => <option key={r} value={r}>{r}</option>)
                        ) : (
                          <option value={selectedRegion}>{selectedRegion}</option>
                        )}
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
                    <div className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-3 min-h-[56px]">
                        <Info size={18} className="text-blue-500 shrink-0" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-tight">Pilih jenis pendapatan di bawah.</span>
                    </div>
                  </div>
               </div>
            </section>

            <div className="space-y-10">
               {isProvinsi ? (
                  <>
                    <ProvinsiForm region={selectedRegion} year={selectedYear} onSave={() => showStatus('success', 'Data Pajak Provinsi Tersimpan')} />
                    <RetribusiForm region={selectedRegion} year={selectedYear} onSave={() => showStatus('success', 'Data Retribusi Provinsi Tersimpan')} />
                  </>
               ) : (
                  <>
                    <KabKotaForm region={selectedRegion} year={selectedYear} onSave={() => showStatus('success', 'Data Pajak Daerah Tersimpan')} />
                    <RetribusiForm region={selectedRegion} year={selectedYear} onSave={() => showStatus('success', 'Data Retribusi Kabupaten/Kota Tersimpan')} />
                  </>
               )}
            </div>
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
            className="fixed top-12 right-10 z-[300] p-8 rounded-[2.5rem] bg-white border border-slate-200 shadow-2xl flex items-center gap-6"
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

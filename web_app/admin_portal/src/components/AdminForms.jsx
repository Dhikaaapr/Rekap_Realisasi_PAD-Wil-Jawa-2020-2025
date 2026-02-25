import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Zap, AlertCircle, CheckCircle2, ShieldCheck, ChevronRight } from 'lucide-react';
import { fetchDetailForEdit, upsertDetailRows, syncPadTotals } from '../lib/supabase';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    maximumFractionDigits: 0 
  }).format(val || 0);
};

// --- COMMON INPUT ROW ---
const InputRow = ({ label, ang, real, onUpdate, index }) => (
  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-300 hover:bg-white transition-all group">
    <div className="md:col-span-6">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-blue-500 transition-colors" />
        <p className="text-[12px] font-bold text-slate-700 uppercase tracking-tight">{label}</p>
      </div>
    </div>
    <div className="md:col-span-3">
        <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">Rp</span>
            <input 
                type="number" 
                value={ang} 
                onChange={e => onUpdate(index, 'ang', e.target.value)} 
                className="neo-input w-full !pl-10 text-right bg-white border-slate-200 text-slate-600 focus:bg-white" 
                placeholder="0" 
            />
        </div>
    </div>
    <div className="md:col-span-3">
        <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-blue-300">Rp</span>
            <input 
                type="number" 
                value={real} 
                onChange={e => onUpdate(index, 'real', e.target.value)} 
                className="neo-input w-full !pl-10 text-right text-blue-700 font-black border-blue-200 bg-blue-50/30 focus:bg-white" 
                placeholder="0" 
            />
        </div>
    </div>
  </div>
);

// --- PROVINSI FORM ---
export const ProvinsiForm = ({ region, year, onSave }) => {
  const [fields, setFields] = useState([
    { label: 'Pajak Kendaraan Bermotor (PKB)', keywords: ['PKB', 'Kendaraan Bermotor'], ang: 0, real: 0, id: null },
    { label: 'Bea Balik Nama Kendaraan Bermotor (BBNKB)', keywords: ['BBNKB', 'Balik Nama'], ang: 0, real: 0, id: null },
    { label: 'Pajak Alat Berat (PAB)', keywords: ['Alat Berat', 'PAB'], ang: 0, real: 0, id: null },
    { label: 'Pajak Bahan Bakar Kendaraan Bermotor (PBBKB)', keywords: ['PBBKB', 'Bahan Bakar'], ang: 0, real: 0, id: null },
    { label: 'Pajak Air Permukaan (PAP)', keywords: ['PAP', 'Air Permukaan'], ang: 0, real: 0, id: null },
    { label: 'Pajak Rokok', keywords: ['Rokok'], ang: 0, real: 0, id: null },
    { label: 'Opsen Pajak MBLB', keywords: ['Opsen Pajak MBLB', 'Opsen MBLB'], ang: 0, real: 0, id: null },
  ]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const details = await fetchDetailForEdit(region, year);
        const updated = fields.map(f => {
          const row = details.find(d => f.keywords.some(k => (d.ref_kategori_pad?.nama || d.kategori_nama || '').includes(k)));
          return row ? { ...f, ang: row.anggaran, real: row.realisasi, id: row.id, kode: row.kategori_kode } : f;
        });
        setFields(updated);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, [region, year]);

  const handleUpdate = (idx, field, val) => {
    const next = [...fields];
    next[idx][field] = parseFloat(val) || 0;
    setFields(next);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const rows = fields.filter(f => f.id).map(f => ({
        id: f.id, anggaran: f.ang, realisasi: f.real, daerah: region, tahun: year, kategori_kode: f.kode
      }));
      await upsertDetailRows(rows);
      await syncPadTotals(region, year);
      if (onSave) onSave();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="p-20 text-center animate-pulse uppercase text-[10px] font-black text-slate-400 tracking-widest">Sinkronisasi Database Provinsi...</div>;

  return (
    <div className="bg-white border border-slate-200 p-10 rounded-[3rem] shadow-sm">
      <div className="flex items-center justify-between mb-10 pb-10 border-b border-slate-100">
        <div>
          <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Entri Pajak Provinsi</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sesuai UU HKPD Pasal 4 Ayat 1</p>
        </div>
        <div className="px-5 py-2 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-black uppercase tracking-widest">
            {region} • {year}
        </div>
      </div>
      <div className="space-y-4">
        {fields.map((f, i) => (
          <InputRow key={i} index={i} label={f.label} ang={f.ang} real={f.real} onUpdate={handleUpdate} />
        ))}
      </div>
      <div className="mt-10 pt-10 border-t border-slate-100 flex justify-end">
        <button onClick={handleSubmit} disabled={saving} className="btn-primary px-12 py-5 flex items-center gap-4">
          {saving ? <RefreshCw className="animate-spin" size={18} /> : <Zap size={18} fill="white" />}
          <span className="text-[11px] font-black uppercase tracking-widest">Publikasikan Data Provinsi</span>
        </button>
      </div>
    </div>
  );
};

// --- KABKOTA FORM ---
export const KabKotaForm = ({ region, year, onSave }) => {
  const [fields, setFields] = useState([
    { label: 'PBB-P2', keywords: ['PBB-P2', 'Bangunan Perdesaan'], ang: 0, real: 0, id: null },
    { label: 'BPHTB', keywords: ['BPHTB', 'Perolehan Hak atas Tanah'], ang: 0, real: 0, id: null },
    { label: 'PBJT', keywords: ['PBJT', 'Barang dan Jasa Tertentu'], ang: 0, real: 0, id: null },
    { label: 'Pajak Reklame', keywords: ['Reklame'], ang: 0, real: 0, id: null },
    { label: 'Pajak Air Tanah (PAT)', keywords: ['PAT', 'Air Tanah'], ang: 0, real: 0, id: null },
    { label: 'Pajak MBLB', keywords: ['MBLB', 'Mineral Bukan Logam'], ang: 0, real: 0, id: null },
    { label: 'Pajak Sarang Burung Walet', keywords: ['Sarang Burung Walet', 'Walet'], ang: 0, real: 0, id: null },
    { label: 'Opsen PKB', keywords: ['Opsen PKB'], ang: 0, real: 0, id: null },
    { label: 'Opsen BBNKB', keywords: ['Opsen BBNKB'], ang: 0, real: 0, id: null },
  ]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const details = await fetchDetailForEdit(region, year);
        const updated = fields.map(f => {
          const row = details.find(d => f.keywords.some(k => (d.ref_kategori_pad?.nama || d.kategori_nama || '').includes(k)));
          return row ? { ...f, ang: row.anggaran, real: row.realisasi, id: row.id, kode: row.kategori_kode } : f;
        });
        setFields(updated);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, [region, year]);

  const handleUpdate = (idx, field, val) => {
    const next = [...fields];
    next[idx][field] = parseFloat(val) || 0;
    setFields(next);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const rows = fields.filter(f => f.id).map(f => ({
        id: f.id, anggaran: f.ang, realisasi: f.real, daerah: region, tahun: year, kategori_kode: f.kode
      }));
      await upsertDetailRows(rows);
      await syncPadTotals(region, year);
      if (onSave) onSave();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="p-20 text-center animate-pulse uppercase text-[10px] font-black text-slate-400 tracking-widest">Sinkronisasi Database Kab/Kota...</div>;

  return (
    <div className="bg-white border border-slate-200 p-10 rounded-[3rem] shadow-sm">
        <div className="flex items-center justify-between mb-10 pb-10 border-b border-slate-100">
            <div>
            <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Entri Pajak Kabupaten/Kota</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sesuai UU HKPD Pasal 4 Ayat 2</p>
            </div>
            <div className="px-5 py-2 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-black uppercase tracking-widest">
                {region} • {year}
            </div>
        </div>
      <div className="space-y-4">
        {fields.map((f, i) => (
          <InputRow key={i} index={i} label={f.label} ang={f.ang} real={f.real} onUpdate={handleUpdate} />
        ))}
      </div>
      <div className="mt-10 pt-10 border-t border-slate-100 flex justify-end">
        <button onClick={handleSubmit} disabled={saving} className="btn-primary px-12 py-5 flex items-center gap-4">
          {saving ? <RefreshCw className="animate-spin" size={18} /> : <Zap size={18} fill="white" />}
          <span className="text-[11px] font-black uppercase tracking-widest">Publikasikan Data Kab/Kota</span>
        </button>
      </div>
    </div>
  );
};

// --- RETRIBUSI FORM ---
export const RetribusiForm = ({ region, year, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState([
    { label: 'Retribusi Jasa Umum', keywords: ['Jasa Umum'], ang: 0, real: 0, id: null },
    { label: 'Retribusi Jasa Usaha', keywords: ['Jasa Usaha'], ang: 0, real: 0, id: null },
    { label: 'Retribusi Perizinan Tertentu', keywords: ['Perizinan Tertentu'], ang: 0, real: 0, id: null },
  ]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const details = await fetchDetailForEdit(region, year);
        const updated = data.map(f => {
          const row = details.find(d => f.keywords.some(k => (d.ref_kategori_pad?.nama || d.kategori_nama || '').includes(k)));
          return row ? { ...f, ang: row.anggaran, real: row.realisasi, id: row.id, kode: row.kategori_kode } : f;
        });
        setData(updated);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, [region, year]);

  const handleUpdate = (idx, field, val) => {
    const next = [...data];
    next[idx][field] = parseFloat(val) || 0;
    setData(next);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const rows = data.filter(f => f.id).map(f => ({
        id: f.id, anggaran: f.ang, realisasi: f.real, daerah: region, tahun: year, kategori_kode: f.kode
      }));
      await upsertDetailRows(rows);
      await syncPadTotals(region, year);
      if (onSave) onSave();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  if (loading) return null;

  return (
    <div className="bg-white border border-slate-200 p-10 rounded-[3rem] shadow-sm">
      <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter mb-8 pb-8 border-b border-slate-100">Entri Retribusi Daerah</h3>
      <div className="space-y-4">
        {data.map((f, i) => (
          <InputRow key={i} index={i} label={f.label} ang={f.ang} real={f.real} onUpdate={handleUpdate} />
        ))}
      </div>
      <div className="mt-8 flex justify-end">
        <button onClick={handleSubmit} disabled={saving} className="px-10 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black text-blue-700 uppercase tracking-widest hover:bg-white hover:border-blue-400 transition-all shadow-sm">
          Simpan Data Retribusi
        </button>
      </div>
    </div>
  );
};

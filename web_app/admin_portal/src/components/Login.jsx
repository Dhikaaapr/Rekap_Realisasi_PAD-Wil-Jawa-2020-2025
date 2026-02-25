import React, { useState } from 'react';
import { ShieldCheck, Zap, Lock, User, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { loginAdmin } from '../lib/supabase';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const user = await loginAdmin(username, password);
      // Save to localStorage for persistence
      localStorage.setItem('admin_user', JSON.stringify(user));
      onLogin(user);
    } catch (err) {
      setError(err.message || 'Gagal login bro, cek koneksi atau akunmu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 blur-[120px] rounded-full" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white border border-slate-200 p-10 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-600 to-transparent opacity-50" />
          
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center text-white shadow-xl mb-6 group transition-transform hover:scale-105 active:scale-95">
              <Zap size={40} fill="white" className="group-hover:animate-pulse" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic text-center">
              PAD<span className="text-blue-600">ADMIN</span>
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Regional Oversight System</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-blue-700 uppercase tracking-widest ml-4 italic">Login Identifier</label>
              <div className="relative group">
                <div className="absolute left-0 top-0 bottom-0 w-14 flex items-center justify-center pointer-events-none z-10">
                  <User size={20} className="text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                </div>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username wilayah..." 
                  className="neo-input w-full !pl-14 pr-6 bg-slate-50 border-slate-200 focus:bg-white transition-all font-bold text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-blue-700 uppercase tracking-widest ml-4 italic">Security Token</label>
              <div className="relative group">
                <div className="absolute left-0 top-0 bottom-0 w-14 flex items-center justify-center pointer-events-none z-10">
                  <Lock size={20} className="text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="neo-input w-full !pl-14 pr-6 bg-slate-50 border-slate-200 focus:bg-white transition-all font-bold text-sm"
                  required
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-3"
                >
                  <AlertCircle size={18} className="text-rose-600 shrink-0" />
                  <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-16 bg-blue-700 hover:bg-blue-800 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] italic flex items-center justify-center gap-3 shadow-lg shadow-blue-700/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <>
                  Connect Uplink <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col items-center gap-4 text-center">
            <div className="flex items-center gap-2 text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">
              <ShieldCheck size={12} /> Encrypted Session V2.8
            </div>
            <p className="text-[8px] font-bold text-slate-400 uppercase leading-relaxed max-w-[240px]">
              Sesuai Protokol UU HKPD, akses ini hanya diperuntukkan bagi petugas pengelola keuangan daerah wilayah Jawa.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

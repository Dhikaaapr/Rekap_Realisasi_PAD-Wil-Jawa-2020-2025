import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Info,
  Eye,
  EyeOff,
  AlertCircle,
  UserPlus,
  LogIn,
} from "lucide-react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "../firebase";

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isRegister) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        await updateProfile(userCredential.user, { displayName: name });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      console.error(err);
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        setError("Email atau password salah bro.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("Email sudah terdaftar bro, silakan login.");
      } else if (err.code === "auth/weak-password") {
        setError("Password minimal 6 karakter bro.");
      } else {
        setError("Terjadi kesalahan: " + err.code);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d123d] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Animated Background Elements */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [0, 50, 0],
          y: [0, -50, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute w-[800px] h-[800px] bg-brand-500/20 rounded-full blur-[120px] -top-96 -left-96 z-0"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
          x: [0, -100, 0],
          y: [0, 100, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[100px] -bottom-48 -right-48 z-0"
      />

      {/* Main Login/Register Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[48px] p-10 md:p-16 shadow-2xl relative overflow-hidden">
          {/* Top Logo Section */}
          <div className="flex flex-col items-center mb-10 text-center">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-20 h-20 bg-brand-500 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-brand-500/40 border border-brand-400/30"
            >
              <Database size={36} className="text-white" />
            </motion.div>
            <h1 className="font-header text-3xl font-black text-white uppercase tracking-tighter">
              PAD JAWA <span className="text-brand-400 font-light">PORTAL</span>
            </h1>
            <p className="text-brand-300/60 text-[10px] font-black uppercase tracking-[0.4em] mt-3">
              {isRegister
                ? "Membuat Akun Administrator Baru"
                : "Executive Dashboard Access"}
            </p>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3 text-rose-400 text-sm font-medium"
                >
                  <AlertCircle size={20} className="flex-shrink-0" />
                  <p>{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {isRegister && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <label className="text-[10px] font-black text-brand-300 uppercase tracking-widest ml-1">
                  Nama Lengkap
                </label>
                <div className="relative group">
                  <LogIn
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-brand-400 transition-colors"
                    size={20}
                  />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all text-sm font-body"
                    placeholder="Contoh: Admin"
                  />
                </div>
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-brand-300 uppercase tracking-widest ml-1">
                Email Administrator
              </label>
              <div className="relative group">
                <Mail
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-brand-400 transition-colors"
                  size={20}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all text-sm font-body"
                  placeholder="admin@padjawa.go.id"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black text-brand-300 uppercase tracking-widest">
                  Password
                </label>
              </div>
              <div className="relative group">
                <Lock
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-brand-400 transition-colors"
                  size={20}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-14 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all text-sm font-body"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors px-2"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/50 text-white rounded-2xl py-5 font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-brand-500/30 flex items-center justify-center gap-3 group transition-all active:scale-[0.98] mt-8 overflow-hidden relative"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="relative z-10">
                    {isRegister ? "Daftar Sekarang" : "Masuk Ke Portal"}
                  </span>
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform relative z-10"
                  />
                </>
              )}
            </button>

            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError("");
                }}
                className="text-brand-300/60 hover:text-white text-xs font-bold transition-all"
              >
                {isRegister ? (
                  <>
                    Sudah punya akun?{" "}
                    <span className="text-brand-400 font-black decoration-brand-400/30 underline underline-offset-4">
                      LOGIN DISINI
                    </span>
                  </>
                ) : (
                  <>
                    Belum punya akun admin?{" "}
                    <span className="text-brand-400 font-black decoration-brand-400/30 underline underline-offset-4">
                      DAFTAR SEKARANG
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Bottom Security Info */}
          <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-center gap-6 opacity-40">
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">
                SSL Secure
              </span>
            </div>
            <div className="flex items-center gap-2">
              <UserPlus size={14} className="text-brand-400" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">
                Role: Admin
              </span>
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <p className="text-center text-white/20 text-[10px] uppercase font-black tracking-[0.3em] mt-8">
          &copy; {new Date().getFullYear()} Kementerian Dalam Negeri • Wilayah
          Jawa
        </p>
      </motion.div>
    </div>
  );
};

export default Login;

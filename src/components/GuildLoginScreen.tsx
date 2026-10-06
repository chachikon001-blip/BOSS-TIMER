import React, { useState } from 'react';
import { 
  Flame, 
  Lock, 
  User, 
  KeyRound, 
  LogIn, 
  UserPlus, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Sparkles,
  Users,
  Clock,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import { UserAccount } from '../types/boss';

interface GuildLoginScreenProps {
  users: UserAccount[];
  onLogin: (username: string, pass: string) => Promise<{ success: boolean; error?: string } | boolean>;
  onRegister: (data: { username: string; displayName: string; password?: string }) => Promise<{ success: boolean; message?: string; isPending?: boolean } | boolean>;
}

export const GuildLoginScreen: React.FC<GuildLoginScreenProps> = ({
  users,
  onLogin,
  onRegister,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMsg('กรุณากรอก Username');
      return;
    }
    if (!password) {
      setErrorMsg('กรุณากรอกรหัสผ่าน');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await onLogin(username.trim(), password);
      if (typeof res === 'object') {
        if (!res.success) {
          setErrorMsg(res.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง หรือบัญชีถูกระงับ');
        }
      } else if (!res) {
        setErrorMsg('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง หรือบัญชีถูกระงับ');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !displayName.trim()) {
      setErrorMsg('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    if (!password) {
      setErrorMsg('กรุณากำหนดรหัสผ่าน');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const regUsername = username.trim();
      const res = await onRegister({
        username: regUsername,
        displayName: displayName.trim(),
        password,
      });

      if (typeof res === 'object') {
        if (res.success) {
          if (res.isPending) {
            setSuccessMsg(res.message || 'สมัครสมาชิกสำเร็จ! บัญชีของคุณอยู่ระหว่างรอแอดมินอนุมัติ กรุณาติดต่อแอดมินเพื่อเปิดใช้งาน');
            setPassword('');
            setMode('login');
          } else {
            setSuccessMsg(res.message || 'สร้าง ID และเข้าสู่ระบบเรียบร้อยแล้ว!');
            await onLogin(regUsername, password);
          }
        } else {
          setErrorMsg(res.message || 'ไม่สามารถลงทะเบียนได้ ชื่อผู้ใช้นี้อาจมีในระบบแล้ว');
        }
      } else if (res) {
        setSuccessMsg('สมัครสมาชิกสำเร็จ! บัญชีของคุณอยู่ระหว่างรอแอดมินอนุมัติ');
        setPassword('');
        setMode('login');
      } else {
        setErrorMsg('ไม่สามารถลงทะเบียนได้ ชื่อผู้ใช้นี้อาจมีในระบบแล้ว');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'ลงทะเบียนไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuickUser = (u: string) => {
    setUsername(u);
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Show all guild members in quick picker
  const activeMembers = users.filter(u => u.status !== 'rejected');

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Glow Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-indigo-900/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* App Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 shadow-xl shadow-orange-500/20 mb-4 animate-bounce-short">
            <div className="bg-slate-950 p-2.5 rounded-xl">
              <Flame className="w-8 h-8 text-orange-400" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent tracking-wide">
            BOSS TIMER PRO
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
            Lineage 2M Guild Timer & Cloud Sync
          </p>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-3 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold shadow-sm">
            <Lock className="w-3.5 h-3.5" />
            <span>เข้าสู่ระบบด้วย ID กิลด์ (ไม่ต้องใช้บัญชีภายนอก)</span>
          </div>
        </div>

        {/* Card Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Mode Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 rounded-xl mb-6 border border-slate-800/80">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
              }}
              className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-orange-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>เข้าสู่ระบบ</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-orange-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>สมัครสมาชิกใหม่</span>
            </button>
          </div>

          {/* Success Banner (e.g. Registered waiting for approval) */}
          {successMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-300 text-xs flex items-start gap-2.5">
              <Clock className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <p className="font-bold text-amber-200">ส่งคำขอสมัครสำเร็จ!</p>
                <p className="text-[11px] text-amber-300/90 mt-0.5">{successMsg}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className={`mb-5 p-3 rounded-xl border text-xs flex flex-col gap-2 ${
              errorMsg.includes('รอหัวหน้ากิลด์') || errorMsg.includes('อนุมัติ')
                ? 'bg-amber-950/70 border-amber-500/50 text-amber-300'
                : 'bg-rose-950/70 border-rose-500/40 text-rose-300'
            }`}>
              <div className="flex items-start gap-2.5">
                {errorMsg.includes('รอหัวหน้ากิลด์') || errorMsg.includes('อนุมัติ') ? (
                  <Clock className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                )}
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
              {(errorMsg.includes('รอหัวหน้ากิลด์') || errorMsg.includes('อนุมัติ')) && (
                <button
                  type="button"
                  onClick={async () => {
                    setErrorMsg('');
                    setLoading(true);
                    try {
                      await onRegister({ username: username.trim(), displayName: username.trim(), password: password || '123456' });
                      await onLogin(username.trim(), password || '123456');
                    } catch {}
                    setLoading(false);
                  }}
                  className="mt-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ปลดล็อกและเข้าใช้งานทันที</span>
                </button>
              )}
            </div>
          )}

          {/* Form */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  ชื่อผู้ใช้ (Username)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="เช่น pae123, test99, admin"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  รหัสผ่าน (Password)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่าน"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Quick User Picker from existing accounts */}
              {activeMembers && activeMembers.length > 0 && (
                <div className="pt-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-amber-400" />
                      <span>เลือกบัญชีที่มีอยู่:</span>
                    </span>
                    <span className="text-[10px] text-slate-500">(รหัสเริ่มต้น: 123456 / admin123)</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeMembers.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleSelectQuickUser(u.username)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono transition border ${
                          username.toLowerCase() === u.username.toLowerCase()
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                            : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border-slate-700/60'
                        }`}
                      >
                        {u.username}
                        {u.role === 'admin' && (
                          <span className="ml-1 text-[9px] text-amber-400 font-sans font-bold">แอดมิน</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-sm shadow-lg shadow-orange-600/30 active:scale-[0.99] transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>กำลังเข้าสู่ระบบ...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>เข้าสู่ระบบห้องกิลด์</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>เข้าใช้งานได้ทันที:</strong> ไม่ต้องรอขอสิทธิ์หรือรอแอดมินอนุมัติ เพียงตั้งชื่อ ID และรหัสผ่านก็เข้าดูและจัดการเวลาบอสได้ทันที
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  ชื่อผู้ใช้ที่ต้องการ (Username สำหรับล็อกอิน)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="เช่น warrior01, pae123"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  ชื่อตัวละคร / ชื่อเล่นในเกม (Display Name)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="เช่น เป้ บิชอป, นายหัวแคลน"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  ตั้งรหัสผ่าน (Password)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="กำหนดรหัสผ่าน (อย่างน้อย 4 ตัวอักษร)"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-sm shadow-lg shadow-orange-600/30 active:scale-[0.99] transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>กำลังเข้าสู่ระบบ...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>สร้าง ID และเข้าใช้งานทันที (ไม่ต้องรออนุมัติ)</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer Info */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-400">
              ระบบสมาชิกกิลด์ Lineage 2M • ใช้ ID เข้าสู่ระบบได้ทันที
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

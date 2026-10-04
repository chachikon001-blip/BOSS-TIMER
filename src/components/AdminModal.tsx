import React, { useState } from 'react';
import { UserAccount, AppStateData } from '../types/boss';
import { 
  X, 
  ShieldCheck, 
  UserPlus, 
  Users, 
  Trash2, 
  Key, 
  DownloadCloud, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle,
  UserCheck,
  UserX,
  Clock,
  ShieldAlert
} from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserAccount[];
  onCreateUser: (data: { username: string; displayName: string; role: 'admin' | 'member'; password?: string; createdByAdmin?: boolean }) => Promise<void>;
  onUpdateUser: (userId: string, data: Partial<UserAccount>) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  onRestoreBackup: (data: Partial<AppStateData>) => Promise<void>;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  users,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
  onRestoreBackup,
}) => {
  const pendingUsers = users.filter(u => u.status === 'pending' || (!u.active && u.status !== 'rejected' && u.id !== 'admin-master'));
  
  // Default to pending tab if there are pending registrations
  const [activeTab, setActiveTab] = useState<'pending' | 'users' | 'create' | 'backup'>(() => {
    return pendingUsers.length > 0 ? 'pending' : 'users';
  });

  const [editingPasswordUserId, setEditingPasswordUserId] = useState<string | null>(null);
  const [newMemberPassword, setNewMemberPassword] = useState('');

  // Form states for creating user
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('123456');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleApproveUser = async (userId: string, userName: string) => {
    try {
      await onUpdateUser(userId, { active: true, status: 'active' });
      setStatusMsg({ type: 'success', text: `อนุมัติบัญชี "${userName}" เรียบร้อยแล้ว! สมาชิกสามารถเข้าสู่ระบบได้ทันที` });
    } catch {
      setStatusMsg({ type: 'error', text: `ไม่สามารถอนุมัติบัญชี "${userName}" ได้` });
    }
  };

  const handleRejectUser = async (userId: string, userName: string) => {
    if (!confirm(`ต้องการปฏิเสธ/ลบคำขอของ "${userName}" หรือไม่?`)) return;
    try {
      await onDeleteUser(userId);
      setStatusMsg({ type: 'success', text: `ปฏิเสธคำขอของ "${userName}" แล้ว` });
    } catch {
      setStatusMsg({ type: 'error', text: `ลบคำขอของ "${userName}" ไม่สำเร็จ` });
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !displayName.trim()) return;

    try {
      await onCreateUser({
        username: username.trim(),
        displayName: displayName.trim(),
        role,
        password,
        createdByAdmin: true,
      });
      setStatusMsg({ type: 'success', text: `สร้างบัญชี "${username}" สำเร็จเรียบร้อยแล้ว!` });
      setUsername('');
      setDisplayName('');
      setPassword('123456');
      setActiveTab('users');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'สร้างบัญชีไม่สำเร็จ';
      setStatusMsg({ type: 'error', text: errMsg });
    }
  };

  const handleDownloadBackup = () => {
    window.open('/api/backup', '_blank');
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const raw = event.target?.result as string;
        const parsed = JSON.parse(raw);
        if (parsed.bosses) {
          await onRestoreBackup(parsed);
          setStatusMsg({ type: 'success', text: 'กู้คืนข้อมูลสำรองบนคลาวด์สำเร็จแล้ว!' });
        } else {
          setStatusMsg({ type: 'error', text: 'ไฟล์ JSON ไม่ถูกต้อง' });
        }
      } catch {
        setStatusMsg({ type: 'error', text: 'อ่านไฟล์สำรองข้อมูลล้มเหลว' });
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">ระบบจัดการผู้ใช้และข้อมูล (Admin Console)</h2>
              <p className="text-xs text-slate-400">อนุมัติสมาชิกใหม่, กำหนดยศแอดมิน, และสำรองข้อมูลกิลด์</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-4 overflow-x-auto">
          {/* Pending Tab */}
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition relative ${
              activeTab === 'pending'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>รออนุมัติการสมัคร</span>
            {pendingUsers.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-full">
                {pendingUsers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'users'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>สมาชิกทั้งหมด ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('create')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'create'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>สร้าง ID ผู้ใช้โดยตรง</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
              activeTab === 'backup'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <DownloadCloud className="w-3.5 h-3.5" />
            <span>สำรอง & กู้คืนข้อมูล</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 flex-1 space-y-4">
          {statusMsg && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-950/60 border border-rose-500/30 text-rose-300'
            }`}>
              {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Pending Approval Tab */}
          {activeTab === 'pending' && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-950/30 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">ระบบคัดกรองสมาชิกกิลด์ (Admin Approval)</p>
                  <p className="text-amber-400/80 text-[11px] mt-0.5">
                    ผู้ใช้ที่กดสมัครทางหน้าเว็บจะต้องได้รับการกด "อนุมัติ" จาก Admin ก่อน จึงจะสามารถล็อกอินเข้าดูเวลาบอสได้
                  </p>
                </div>
              </div>

              {pendingUsers.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                  <p className="text-sm font-semibold text-slate-200">ไม่มีคำขอรออนุมัติ</p>
                  <p className="text-xs text-slate-400 mt-1">สมาชิกทุกคนได้รับการอนุมัติเรียบร้อยแล้ว หรือยังไม่มีผู้สมัครใหม่</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-xs text-slate-400 font-medium">คำขอรออนุมัติ: {pendingUsers.length} บัญชี</span>
                    <button
                      onClick={async () => {
                        for (const u of pendingUsers) {
                          await handleApproveUser(u.id, u.displayName || u.username);
                        }
                        setStatusMsg({ type: 'success', text: `อนุมัติสมาชิกทั้งหมด ${pendingUsers.length} บัญชีเรียบร้อยแล้ว!` });
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm active:scale-95"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>อนุมัติทั้งหมด ({pendingUsers.length})</span>
                    </button>
                  </div>
                  {pendingUsers.map((u) => (
                    <div 
                      key={u.id}
                      className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition hover:border-amber-500/50"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200 text-sm">{u.displayName}</span>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            รออนุมัติ
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                          <span>User: <strong className="text-indigo-300">{u.username}</strong></span>
                          <span>•</span>
                          <span>สมัครเมื่อ: {u.createdAt ? new Date(u.createdAt).toLocaleDateString('th-TH') : 'ไม่ระบุ'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => handleApproveUser(u.id, u.displayName || u.username)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm active:scale-95"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>อนุมัติให้เข้ากิลด์</span>
                        </button>
                        <button
                          onClick={() => handleRejectUser(u.id, u.displayName || u.username)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900/90 text-rose-300 border border-rose-500/30 text-xs font-medium transition active:scale-95"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>ปฏิเสธ</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* All Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-3">
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-bold">
                    <tr>
                      <th className="p-3">ชื่อตัวละคร (Display)</th>
                      <th className="p-3">Username</th>
                      <th className="p-3">ยศ / สิทธิ์</th>
                      <th className="p-3">สถานะบัญชี</th>
                      <th className="p-3 text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {users.map((u) => {
                      const isPending = u.status === 'pending' || (!u.active && u.status !== 'rejected' && u.id !== 'admin-master');
                      return (
                        <React.Fragment key={u.id}>
                          <tr className="hover:bg-slate-800/40 transition">
                            <td className="p-3 font-semibold text-slate-200">
                              {u.displayName}
                            </td>
                            <td className="p-3 font-mono text-slate-400">{u.username}</td>
                            <td className="p-3">
                              <select
                                value={u.role}
                                disabled={u.id === 'admin-master'}
                                onChange={(e) => onUpdateUser(u.id, { role: e.target.value as 'admin' | 'member' })}
                                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none"
                              >
                                <option value="admin">แอดมิน (Admin)</option>
                                <option value="member">สมาชิกทั่วไป (Member)</option>
                              </select>
                            </td>
                            <td className="p-3">
                              {isPending ? (
                                <button
                                  onClick={() => handleApproveUser(u.id, u.displayName || u.username)}
                                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition flex items-center gap-1"
                                >
                                  <span>รออนุมัติ (คลิกเพื่ออนุมัติ)</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => onUpdateUser(u.id, { active: !u.active, status: !u.active ? 'active' : 'rejected' })}
                                  disabled={u.id === 'admin-master'}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    u.active
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  }`}
                                >
                                  {u.active ? 'เปิดใช้งาน' : 'ระงับชั่วคราว'}
                                </button>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingPasswordUserId(editingPasswordUserId === u.id ? null : u.id);
                                    setNewMemberPassword('');
                                  }}
                                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                                  title="เปลี่ยนรหัสผ่าน"
                                >
                                  <Key className="w-3.5 h-3.5" />
                                </button>
                                {u.id !== 'admin-master' && (
                                  <button
                                    onClick={() => {
                                      if (confirm(`คุณต้องการลบผู้ใช้ "${u.username}" หรือไม่?`)) {
                                        onDeleteUser(u.id);
                                      }
                                    }}
                                    className="p-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-400 border border-rose-500/20"
                                    title="ลบผู้ใช้"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Quick Password Change Form */}
                          {editingPasswordUserId === u.id && (
                            <tr className="bg-slate-950">
                              <td colSpan={5} className="p-3 border-t border-slate-800">
                                <div className="flex items-center gap-2 max-w-sm">
                                  <input
                                    type="text"
                                    placeholder="รหัสผ่านใหม่ (อย่างน้อย 4 ตัว)"
                                    value={newMemberPassword}
                                    onChange={(e) => setNewMemberPassword(e.target.value)}
                                    className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-100 flex-1 focus:outline-none"
                                  />
                                  <button
                                    onClick={async () => {
                                      if (!newMemberPassword.trim()) return;
                                      await onUpdateUser(u.id, { passwordHash: newMemberPassword.trim() });
                                      setEditingPasswordUserId(null);
                                      setStatusMsg({ type: 'success', text: `เปลี่ยนรหัสผ่านของ ${u.username} สำเร็จ` });
                                    }}
                                    className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                                  >
                                    บันทึก
                                  </button>
                                  <button
                                    onClick={() => setEditingPasswordUserId(null)}
                                    className="px-2 py-1 rounded bg-slate-800 text-slate-400 text-xs"
                                  >
                                    ยกเลิก
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Create User Tab */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateSubmit} className="space-y-4 max-w-md mx-auto">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400">
                สร้างบัญชีสมาชิกให้ลูกกิลด์โดยตรง เมื่อสร้างเสร็จสมาชิกจะสามารถเข้าสู่ระบบได้ทันทีโดยไม่ต้องรออนุมัติ
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Username (สำหรับล็อกอิน)
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น pae123, hunter01"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ชื่อตัวละครในเกม (Display Name)
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น เป้ จอมพลัง, นายหัวแคลน"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  รหัสผ่านเริ่มต้น
                </label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  สิทธิ์การใช้งาน
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'admin' | 'member')}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="member">สมาชิกทั่วไป (Member) - ดูเวลา, กดอัปเดตเวลาบอส</option>
                  <option value="admin">แอดมิน (Admin) - จัดการสมาชิก, รีเซ็ตเวลา, เชื่อมต่อชีต</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition active:scale-95"
              >
                สร้างบัญชีผู้ใช้ใหม่
              </button>
            </form>
          )}

          {/* Backup & Restore Tab */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <DownloadCloud className="w-4 h-4 text-emerald-400" />
                  <span>ดาวน์โหลดไฟล์สำรองข้อมูล (JSON Backup)</span>
                </h4>
                <p className="text-xs text-slate-400">
                  ดาวน์โหลดข้อมูลบอส เวลาเกิดทั้งหมด และบัญชีผู้ใช้ เพื่อเก็บสำรองไว้ในเครื่องคอมพิวเตอร์ของคุณ
                </p>
                <button
                  onClick={handleDownloadBackup}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <DownloadCloud className="w-4 h-4" />
                  <span>ดาวน์โหลดไฟล์ Backup</span>
                </button>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4 text-indigo-400" />
                  <span>กู้คืนข้อมูลจากไฟล์สำรอง (Restore Backup)</span>
                </h4>
                <p className="text-xs text-slate-400">
                  เลือกไฟล์สำรองข้อมูล (.json) เพื่อนำข้อมูลบอสและประวัติกลับคืนสู่ระบบ
                </p>
                <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer">
                  <UploadCloud className="w-4 h-4" />
                  <span>เลือกไฟล์กู้คืนข้อมูล</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleRestoreFile}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

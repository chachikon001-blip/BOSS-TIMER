import React, { useState } from 'react';
import { X, PlusCircle, ShieldAlert, Swords } from 'lucide-react';
import { ServerType } from '../types/boss';

interface AddBossModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (bossData: {
    name: string;
    server: ServerType;
    serverTag?: string;
    location: string;
    respawnMinutes: number;
    level?: number;
    notes?: string;
    spawnChance?: number;
    spawnColor?: string;
  }) => void;
  defaultServer: ServerType;
}

export const AddBossModal: React.FC<AddBossModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  defaultServer,
}) => {
  const [name, setName] = useState('');
  const [server, setServer] = useState<ServerType>(defaultServer);
  const [serverTag, setServerTag] = useState(defaultServer === 'main' ? 'T3' : 'S1');
  const [location, setLocation] = useState('');
  const [respawnHours, setRespawnHours] = useState(4);
  const [respawnMins, setRespawnMins] = useState(0);
  const [level, setLevel] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [spawnChance, setSpawnChance] = useState<number>(100);
  const [spawnColor, setSpawnColor] = useState<string>('#d9ead3');

  if (!isOpen) return null;

  const totalRespawnMinutes = Number(respawnHours) * 60 + Number(respawnMins);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAdd({
      name: name.trim(),
      server,
      serverTag: serverTag.trim() || (server === 'main' ? 'T3' : 'S1'),
      location: location.trim() || 'ยังไม่ระบุ',
      respawnMinutes: Math.max(1, totalRespawnMinutes),
      level: level ? Number(level) : undefined,
      notes: notes.trim(),
      spawnChance,
      spawnColor,
    });

    setName('');
    setLocation('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-slate-100">เพิ่มบอสตัวใหม่</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {/* Server Selector & Tag */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">เซิร์ฟเวอร์ และ แท็ก</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setServer('main');
                  if (!serverTag || serverTag === 'S1') setServerTag('T3');
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-bold transition ${
                  server === 'main'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
                <span>เซิร์ฟหลัก</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setServer('sub');
                  if (!serverTag || serverTag === 'T3') setServerTag('S1');
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-bold transition ${
                  server === 'sub'
                    ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <Swords className="w-3.5 h-3.5 text-purple-400" />
                <span>เซิร์ฟรอง</span>
              </button>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                ชื่อ / แท็กย่อเซิร์ฟเวอร์ (เช่น T3, S1 สำหรับอ่านออกเสียงเตือน)
              </label>
              <input
                type="text"
                value={serverTag}
                onChange={(e) => setServerTag(e.target.value)}
                placeholder="เช่น T3"
                className="w-full px-3 py-1.5 bg-slate-950 border border-amber-500/50 rounded-lg text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Boss Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              ชื่อบอส <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="เช่น ควีนแอนท์ หรือ Queen Ant"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Location & Level */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">สถานที่ / แผนที่</label>
              <input
                type="text"
                placeholder="เช่น ถ้ำมด ชั้น 3"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">เลเวลบอส (ถ้ามี)</label>
              <input
                type="number"
                placeholder="เช่น 55"
                value={level}
                onChange={(e) => setLevel(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Respawn Cooldown (2 separate boxes: Hours & Minutes) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              รอบเวลาเกิดใหม่ (ใส่ 2 ช่อง: ชม. และ นาที)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="168"
                  required
                  value={respawnHours}
                  onChange={(e) => setRespawnHours(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full pl-3 pr-8 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                  ชม.
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="59"
                  required
                  value={respawnMins}
                  onChange={(e) => setRespawnMins(Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0)))}
                  className="w-full pl-3 pr-9 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                  นาที
                </span>
              </div>
            </div>
            <div className="text-[11px] text-amber-400/80 mt-1">
              รวมรอบเวลา: {totalRespawnMinutes} นาที
            </div>
          </div>

          {/* Spawn Chance & Color for Google Sheet */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-amber-300">
                โอกาสบอสเกิด (%) และ สีประจำบอส (สำหรับคัดลอกลงชีต)
              </label>
              <span className="text-[10px] text-slate-400">ใช้จับคู่สีชีตอัตโนมัติ</span>
            </div>

            {/* Quick Presets matching User Sheet */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSpawnChance(100);
                  setSpawnColor('#d9ead3');
                }}
                className={`p-2 rounded-lg border text-xs font-bold transition flex flex-col items-center gap-1 ${
                  spawnChance === 100 && spawnColor === '#d9ead3'
                    ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 ring-1 ring-emerald-500'
                    : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-[#d9ead3] border border-emerald-400 shrink-0" />
                <span>เกิด 100%</span>
                <span className="text-[10px] font-normal text-emerald-400">สีเขียว</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSpawnChance(50);
                  setSpawnColor('#fff2cc');
                }}
                className={`p-2 rounded-lg border text-xs font-bold transition flex flex-col items-center gap-1 ${
                  spawnChance === 50 && spawnColor === '#fff2cc'
                    ? 'border-amber-500 bg-amber-950/40 text-amber-300 ring-1 ring-amber-500'
                    : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-[#fff2cc] border border-amber-400 shrink-0" />
                <span>โอกาส 50%</span>
                <span className="text-[10px] font-normal text-amber-400">สีเหลือง</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSpawnChance(33);
                  setSpawnColor('#f4cccc');
                }}
                className={`p-2 rounded-lg border text-xs font-bold transition flex flex-col items-center gap-1 ${
                  spawnChance === 33 && spawnColor === '#f4cccc'
                    ? 'border-rose-500 bg-rose-950/40 text-rose-300 ring-1 ring-rose-500'
                    : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-[#f4cccc] border border-rose-400 shrink-0" />
                <span>โอกาส 33%</span>
                <span className="text-[10px] font-normal text-rose-400">สีแดง</span>
              </button>
            </div>

            {/* Custom Chance & Color Picker */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">ระบุ % โอกาสเกิดเอง</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={spawnChance}
                    onChange={(e) => setSpawnChance(Math.max(1, Math.min(100, parseInt(e.target.value, 10) || 100)))}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 font-mono pr-7 focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">%</span>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">เลือกสีแถวในชีต</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={spawnColor}
                    onChange={(e) => setSpawnColor(e.target.value)}
                    className="w-8 h-8 rounded border border-slate-700 bg-slate-900 cursor-pointer p-0.5"
                  />
                  <span className="text-xs font-mono text-slate-300 uppercase">{spawnColor}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">หมายเหตุ</label>
            <input
              type="text"
              placeholder="จุดเด่น, ไอเทมดรอปหลัก"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/30"
            >
              เพิ่มบอส
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

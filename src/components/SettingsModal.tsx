import React, { useState } from 'react';
import { NotificationSettings } from '../types/boss';
import { 
  X, 
  Bell, 
  Volume2, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  Radio, 
  Mic, 
  Save, 
  Sliders,
  Languages,
  Server,
  Share2,
  TableProperties,
  RotateCcw,
  Check,
  Copy,
  Wrench,
  ExternalLink
} from 'lucide-react';
import { playBossAlert } from '../services/audio';
import { getLiveShareUrl } from '../services/apiConfig';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: NotificationSettings;
  onSave: (newSettings: NotificationSettings) => void;
  onOpenSheets?: () => void;
  onOpenReboot?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  onOpenSheets,
  onOpenReboot,
}) => {
  const [localSettings, setLocalSettings] = useState<NotificationSettings>({ ...settings });
  const [activeTab, setActiveTab] = useState<'tools' | 'audio' | 'server' | 'discord' | 'line'>('tools');
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [testDiscordStatus, setTestDiscordStatus] = useState<{ loading: boolean; msg?: string; success?: boolean }>({ loading: false });
  const [testLineStatus, setTestLineStatus] = useState<{ loading: boolean; msg?: string; success?: boolean }>({ loading: false });

  // Sync state ONLY when modal transitions to open (do not overwrite while user is modifying settings!)
  React.useEffect(() => {
    if (isOpen) {
      setLocalSettings({ ...settings });
    }
  }, [isOpen]);

  const handleCopyShare = async () => {
    try {
      const url = getLiveShareUrl();
      await navigator.clipboard.writeText(url);
      setCopiedShareLink(true);
      setTimeout(() => setCopiedShareLink(false), 3000);
    } catch {
      // fallback
    }
  };

  const handleStageToggle = (stage: number) => {
    const stages = localSettings.notifyAtMinutes || [10, 5, 3, 1];
    let nextStages: number[];
    if (stages.includes(stage)) {
      nextStages = stages.filter(s => s !== stage);
    } else {
      nextStages = [...stages, stage].sort((a, b) => b - a);
    }
    setLocalSettings({ ...localSettings, notifyAtMinutes: nextStages });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setLocalSettings({
        ...localSettings,
        soundType: 'custom',
        customSoundUrl: result,
      });
      // Test playback
      playBossAlert('custom', localSettings.soundVolume, result);
    };
    reader.readAsDataURL(file);
  };

  const handleTestSound = () => {
    playBossAlert(
      localSettings.soundType,
      localSettings.soundVolume,
      localSettings.customSoundUrl,
      { 
        name: 'เทมเพสต์ - Valefar', 
        server: 'main', 
        serverTag: localSettings.mainServerTag || 'T3', 
        minutesLeft: 5 
      },
      localSettings.ttsLanguage || 'thai_only',
      localSettings.ttsSpeed || 1.05
    );
  };

  const handleSelectSoundType = (typeId: any) => {
    const updated = { ...localSettings, soundType: typeId };
    setLocalSettings(updated);
    // Auto-save immediately so selection is permanently stored
    onSave(updated);
    try {
      localStorage.setItem('boss_timer_settings', JSON.stringify(updated));
    } catch {}
    // Instant audio preview
    playBossAlert(
      typeId,
      updated.soundVolume,
      updated.customSoundUrl,
      { 
        name: 'เทมเพสต์ - Valefar', 
        server: 'main', 
        serverTag: updated.mainServerTag || 'T3', 
        minutesLeft: 5 
      },
      updated.ttsLanguage || 'thai_only',
      updated.ttsSpeed || 1.05
    );
  };

  const handleSaveDirectly = (overrideSettings?: NotificationSettings) => {
    const toSave = overrideSettings || localSettings;
    onSave(toSave);
    onClose();
  };

  const handleTestDiscord = async () => {
    if (!localSettings.discordWebhookUrl) {
      setTestDiscordStatus({ loading: false, success: false, msg: 'กรุณากรอก Webhook URL' });
      return;
    }

    setTestDiscordStatus({ loading: true });
    try {
      const res = await fetch('/api/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'discord', url: localSettings.discordWebhookUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestDiscordStatus({ loading: false, success: true, msg: 'ส่งเข้า Discord เรียบร้อยแล้ว!' });
      } else {
        setTestDiscordStatus({ loading: false, success: false, msg: data.error || 'ส่งไม่สำเร็จ' });
      }
    } catch {
      setTestDiscordStatus({ loading: false, success: false, msg: 'การเชื่อมต่อผิดพลาด' });
    }
  };

  const handleTestLine = async () => {
    if (!localSettings.lineWebhookUrl) {
      setTestLineStatus({ loading: false, success: false, msg: 'กรุณากรอก LINE Webhook หรือ Token' });
      return;
    }

    setTestLineStatus({ loading: true });
    try {
      const res = await fetch('/api/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'line', url: localSettings.lineWebhookUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestLineStatus({ loading: false, success: true, msg: 'ส่งเข้า LINE เรียบร้อยแล้ว!' });
      } else {
        setTestLineStatus({ loading: false, success: false, msg: data.error || 'ส่งไม่สำเร็จ' });
      }
    } catch {
      setTestLineStatus({ loading: false, success: false, msg: 'การเชื่อมต่อผิดพลาด' });
    }
  };

  const handleRequestPushPermission = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        new Notification('Boss Timer Pro', {
          body: 'การแจ้งเตือนแบบพุชเปิดใช้งานแล้ว!',
          icon: '/favicon.ico',
        });
        setLocalSettings({ ...localSettings, browserPushEnabled: true });
      }
    }
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[88vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header (Fixed) */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-400" />
            <h2 className="text-base font-bold text-slate-100">การตั้งค่าการแจ้งเตือน</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Alert Timing (10, 5, 3, 1 min) (Fixed) */}
        <div className="p-3.5 sm:p-4 bg-slate-950/60 border-b border-slate-800/80 space-y-2 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200">
              ⏱️ แจ้งเตือนล่วงหน้าก่อนบอสเกิด (นาที):
            </span>
            <span className="text-[11px] text-amber-400">ทำงานอัตโนมัติทั้งในเว็บ, Discord และ LINE</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[10, 5, 3, 1].map((stage) => {
              const active = (localSettings.notifyAtMinutes || []).includes(stage);
              return (
                <button
                  key={stage}
                  type="button"
                  onClick={() => handleStageToggle(stage)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                    active
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                      : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                  }`}
                >
                  {stage} นาทีก่อนเกิด {active ? '✓' : ''}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sub-tabs (Fixed) */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-4 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('tools')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition shrink-0 ${
              activeTab === 'tools'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>เครื่องมือ & จัดการ (ชีต/รีบูท/แชร์)</span>
          </button>

          <button
            onClick={() => setActiveTab('audio')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition shrink-0 ${
              activeTab === 'audio'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>เสียงแจ้งเตือน & ภาษาไทย</span>
          </button>

          <button
            onClick={() => setActiveTab('server')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition shrink-0 ${
              activeTab === 'server'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>รหัสเซิร์ฟเวอร์</span>
          </button>

          <button
            onClick={() => setActiveTab('discord')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition shrink-0 ${
              activeTab === 'discord'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Discord Webhook</span>
          </button>

          <button
            onClick={() => setActiveTab('line')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition shrink-0 ${
              activeTab === 'line'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>LINE แจ้งเตือน</span>
          </button>
        </div>

        {/* Tab Content (Scrollable) */}
        <div className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto">
          {/* 1. Tools Tab (Google Sheets, Reboot Server, Share Link) */}
          {activeTab === 'tools' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200">
                ✨ รวมเครื่องมือหลักและบริการทั้งหมดไว้ที่นี่ เพื่อความสะดวกในการจัดการกิลด์
              </div>

              {/* Tool 1: Google Sheets */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 hover:border-emerald-500/40 transition">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <TableProperties className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                        <span>Google Sheets (ซิงค์ & คัดลอกช่อง A-F)</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        ซิงค์ข้อมูลกับ Google Sheet, นำเข้าบอส, และคัดลอกตารางช่อง A-F พร้อมสีไปวาง
                      </p>
                    </div>
                  </div>
                  {onOpenSheets && (
                    <button
                      type="button"
                      onClick={onOpenSheets}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 shrink-0 active:scale-95"
                    >
                      <TableProperties className="w-4 h-4" />
                      <span>เปิด Google Sheets</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Tool 2: Server Reboot */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 hover:border-amber-500/40 transition">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                        <span>รีบูทเซิร์ฟเวอร์ (Server Reboot - ช่อง P)</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        คำนวณและรีเซ็ตเวลาเกิดใหม่ของบอสทั้งเซิร์ฟเวอร์อัตโนมัติ ตามเวลาเปิดเซิร์ฟใหม่
                      </p>
                    </div>
                  </div>
                  {onOpenReboot && (
                    <button
                      type="button"
                      onClick={onOpenReboot}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/30 shrink-0 active:scale-95"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>เปิดรีบูทเซิร์ฟเวอร์</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Tool 3: Share Live Link */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 hover:border-sky-500/40 transition">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                      <span>แชร์ลิงก์ให้เพื่อนในกิลด์ (Live Sync)</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      ทุกคนที่เปิดลิงก์นี้จะเห็นเวลาบอส อัปเดตและแจ้งเตือนซิงค์ตรงกันแบบเรียลไทม์
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <input
                    type="text"
                    readOnly
                    value={getLiveShareUrl()}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-300 select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyShare}
                    className={`w-full sm:w-auto px-4 py-2 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 active:scale-95 ${
                      copiedShareLink
                        ? 'bg-emerald-900/60 text-emerald-200 border-emerald-500/60 shadow-sm'
                        : 'bg-sky-600 hover:bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-600/30'
                    }`}
                  >
                    {copiedShareLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>คัดลอกสำเร็จ!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-white" />
                        <span>คัดลอกลิงก์</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'audio' && (
            <div className="space-y-4">
              {/* Sound Type Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    เลือกสไตล์เสียงแจ้งเตือน (คลิกเพื่อทดลองฟังทันที)
                  </label>
                  <span className="text-[10px] text-amber-400">คลิกที่ปุ่มเพื่อทดสอบเสียง</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { id: 'synth_chime', label: 'กระดิ่งสังเคราะห์ (Synth Chime)', desc: 'เสียงใส นุ่มนวล ไม่แสบหู' },
                    { id: 'tts_thai', label: '🗣️ เสียงพูดภาษาไทย (Thai TTS)', desc: 'พูดชื่อบอสและเวลานาทีชัดเจน' },
                    { id: 'warning_siren', label: 'ไซเรนเตือนภัย (Warning Siren)', desc: 'เตือนหนักแน่น ตื่นตัว' },
                    { id: 'horn', label: 'แตรสัญญาณ (Fanfare Horn)', desc: 'เสียงแตรชัยชนะ อลังการ' },
                    { id: '8bit', label: 'เกมเรโทร 8-Bit', desc: 'คลาสสิกเกมตลับ RPG' },
                    { id: 'sci_fi', label: 'ไฮเทค ไซไฟ (Sci-Fi Pulse)', desc: 'ล้ำสมัย แบบเรดาร์' },
                  ].map((s) => {
                    const isSelected = localSettings.soundType === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectSoundType(s.id as any)}
                        className={`p-3 rounded-xl border text-left transition flex items-start justify-between gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500 text-amber-200 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/40'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <span>{s.label}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{s.desc}</div>
                        </div>
                        {isSelected && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950 shrink-0">
                            เลือกอยู่ ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Language Selection for TTS (Thai only, English only, All) */}
              {localSettings.soundType === 'tts_thai' && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/40 space-y-3 animate-fade-in shadow-lg shadow-amber-950/20">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Languages className="w-4 h-4 text-amber-400" />
                      <span>เลือกภาษาการอ่านชื่อบอส (TTS Language):</span>
                    </label>
                    <span className="text-[10px] text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-mono">
                      เช่น เทมเพสต์ - Valefar
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...localSettings, ttsLanguage: 'thai_only' as const };
                        setLocalSettings(updated);
                        playBossAlert('tts_thai', updated.soundVolume, undefined, {
                          name: 'เทมเพสต์ - Valefar',
                          server: 'main',
                          serverTag: updated.mainServerTag || 'T3',
                          minutesLeft: 5,
                        }, 'thai_only', updated.ttsSpeed || 1.05);
                      }}
                      className={`p-2.5 rounded-lg border text-left transition ${
                        (localSettings.ttsLanguage || 'thai_only') === 'thai_only'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold flex items-center justify-between">
                        <span>🇹🇭 ไทยเท่านั้น</span>
                        {(localSettings.ttsLanguage || 'thai_only') === 'thai_only' && <span className="text-amber-400">✓</span>}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">อ่านเฉพาะ "เทมเพสต์" (ไม่อ่านภาษาอังกฤษ)</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...localSettings, ttsLanguage: 'english_only' as const };
                        setLocalSettings(updated);
                        playBossAlert('tts_thai', updated.soundVolume, undefined, {
                          name: 'เทมเพสต์ - Valefar',
                          server: 'main',
                          serverTag: updated.mainServerTag || 'T3',
                          minutesLeft: 5,
                        }, 'english_only', updated.ttsSpeed || 1.05);
                      }}
                      className={`p-2.5 rounded-lg border text-left transition ${
                        localSettings.ttsLanguage === 'english_only'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold flex items-center justify-between">
                        <span>🇺🇸 อังกฤษเท่านั้น</span>
                        {localSettings.ttsLanguage === 'english_only' && <span className="text-amber-400">✓</span>}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">อ่านเฉพาะ "Valefar" (ไม่อ่านภาษาไทย)</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...localSettings, ttsLanguage: 'all' as const };
                        setLocalSettings(updated);
                        playBossAlert('tts_thai', updated.soundVolume, undefined, {
                          name: 'เทมเพสต์ - Valefar',
                          server: 'main',
                          serverTag: updated.mainServerTag || 'T3',
                          minutesLeft: 5,
                        }, 'all', updated.ttsSpeed || 1.05);
                      }}
                      className={`p-2.5 rounded-lg border text-left transition ${
                        localSettings.ttsLanguage === 'all'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold flex items-center justify-between">
                        <span>🌐 อ่านทั้งหมด</span>
                        {localSettings.ttsLanguage === 'all' && <span className="text-amber-400">✓</span>}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">อ่านชื่อเต็มทั้งสองภาษา</div>
                    </button>
                  </div>

                  {/* Speech Rate Control & Quick Save */}
                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">ความเร็วเสียงพูด:</span>
                      <div className="flex gap-1.5">
                        {[
                          { speed: 0.95, label: '0.95x ช้า' },
                          { speed: 1.05, label: '1.05x ปกติ' },
                          { speed: 1.2, label: '1.20x เร็ว' },
                        ].map((item) => (
                          <button
                            key={item.speed}
                            type="button"
                            onClick={() => {
                              const updated = { ...localSettings, ttsSpeed: item.speed };
                              setLocalSettings(updated);
                              handleTestSound();
                            }}
                            className={`px-2 py-1 rounded text-[11px] font-medium border transition ${
                              (localSettings.ttsSpeed || 1.05) === item.speed
                                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSaveDirectly(localSettings)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 text-xs ml-auto transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>บันทึกและใช้เสียงพูดทันที</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Custom Audio File Upload */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-slate-200">อัปโหลดไฟล์เสียงของตัวเอง (.mp3 / .wav)</span>
                  </div>
                  {localSettings.soundType === 'custom' && (
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      กำลังใช้งานไฟล์นี้
                    </span>
                  )}
                </div>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-amber-300 hover:file:bg-slate-700 cursor-pointer"
                />
              </div>

              {/* Volume Slider & Test Button */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    <Sliders className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                    ระดับความดังเสียง: {Math.round(localSettings.soundVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={localSettings.soundVolume}
                  onChange={(e) => setLocalSettings({ ...localSettings, soundVolume: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                
                <button
                  type="button"
                  onClick={handleTestSound}
                  className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>🔊 กดทดสอบฟังเสียงที่เลือกตอนนี้</span>
                </button>
              </div>

              {/* Browser Push */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <div className="text-xs font-semibold text-slate-200">การแจ้งเตือนป๊อปอัปบนหน้าจอ (Web Push)</div>
                  <div className="text-[11px] text-slate-500">แจ้งเตือนแม้จะย่อหน้าต่างหรือสลับแอป</div>
                </div>
                <button
                  type="button"
                  onClick={handleRequestPushPermission}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
                >
                  ขออนุญาตเบราว์เซอร์
                </button>
              </div>
            </div>
          )}

          {activeTab === 'discord' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-200">เปิดใช้งานส่งเข้า Discord</span>
                  <p className="text-[11px] text-slate-500">ส่งแจ้งเตือนบอสเกิด 10, 5, 3, 1 นาทีพร้อมการ์ดสีสวยงาม</p>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.discordEnabled}
                  onChange={(e) => setLocalSettings({ ...localSettings, discordEnabled: e.target.checked })}
                  className="w-4 h-4 accent-indigo-500 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Discord Webhook URL
                </label>
                <input
                  type="url"
                  placeholder="https://discord.com/api/webhooks/..."
                  value={localSettings.discordWebhookUrl}
                  onChange={(e) => setLocalSettings({ ...localSettings, discordWebhookUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  วิธีสร้าง: ไปที่ห้อง Discord &gt; แก้ไขห้อง (Edit Channel) &gt; การผสานรวม (Integrations) &gt; สร้าง Webhook
                </p>
              </div>

              <button
                type="button"
                onClick={handleTestDiscord}
                disabled={testDiscordStatus.loading}
                className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{testDiscordStatus.loading ? 'กำลังส่งทดสอบ...' : 'ทดสอบส่งข้อความเข้า Discord'}</span>
              </button>

              {testDiscordStatus.msg && (
                <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  testDiscordStatus.success ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-300' : 'bg-rose-950/60 border border-rose-500/30 text-rose-300'
                }`}>
                  {testDiscordStatus.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{testDiscordStatus.msg}</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'line' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-200">เปิดใช้งานแจ้งเตือนผ่าน LINE</span>
                  <p className="text-[11px] text-slate-500">แจ้งเตือนเข้ากลุ่มกิลด์ หรือแชทส่วนตัว</p>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.lineEnabled}
                  onChange={(e) => setLocalSettings({ ...localSettings, lineEnabled: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  LINE Notify / Webhook URL
                </label>
                <input
                  type="text"
                  placeholder="https://notify-api.line.me/api/notify หรือ Webhook URL"
                  value={localSettings.lineWebhookUrl}
                  onChange={(e) => setLocalSettings({ ...localSettings, lineWebhookUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  รองรับทั้ง LINE Notify API หรือ Incoming Webhook ของ LINE Messaging API
                </p>
              </div>

              <button
                type="button"
                onClick={handleTestLine}
                disabled={testLineStatus.loading}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30 transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{testLineStatus.loading ? 'กำลังส่งทดสอบ...' : 'ทดสอบส่งข้อความเข้า LINE'}</span>
              </button>

              {testLineStatus.msg && (
                <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  testLineStatus.success ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-300' : 'bg-rose-950/60 border border-rose-500/30 text-rose-300'
                }`}>
                  {testLineStatus.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{testLineStatus.msg}</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'server' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-slate-200">
                    ตั้งค่ารหัสและชื่อเซิร์ฟเวอร์ (ปรับเปลี่ยนได้ตลอดเวลา)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  เช่น วันนี้เซิร์ฟหลักเป็น <strong>T3</strong> เซิร์ฟรองเป็น <strong>B9</strong> พรุ่งนี้อาจจะเปลี่ยนเป็นเซิร์ฟอื่น สามารถแก้ไขได้ทันที และระบบจะอัปเดตป้ายชื่อบอสทุกตัวให้โดยอัตโนมัติ
                </p>
              </div>

              {/* Main Server Tag */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="text-xs font-semibold text-blue-300 flex items-center justify-between">
                  <span>รหัสเซิร์ฟเวอร์หลัก (Main Server Tag)</span>
                  <span className="text-[10px] text-slate-500">ปัจจุบัน: {localSettings.mainServerTag || 'T3'}</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={localSettings.mainServerTag || 'T3'}
                    onChange={(e) => setLocalSettings({ ...localSettings, mainServerTag: e.target.value.toUpperCase() })}
                    placeholder="เช่น T3, T1, Main"
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono font-bold text-blue-200 focus:outline-none focus:border-blue-500 uppercase"
                  />
                  <div className="flex gap-1">
                    {['T3', 'T1', 'T2', 'Main'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setLocalSettings({ ...localSettings, mainServerTag: tag })}
                        className="px-2 py-1 bg-slate-800 hover:bg-blue-600 hover:text-white rounded text-[11px] font-mono text-slate-300 border border-slate-700 transition"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sub Server Tag */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="text-xs font-semibold text-purple-300 flex items-center justify-between">
                  <span>รหัสเซิร์ฟเวอร์รอง (Sub Server Tag)</span>
                  <span className="text-[10px] text-slate-500">ปัจจุบัน: {localSettings.subServerTag || 'B9'}</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={localSettings.subServerTag || 'B9'}
                    onChange={(e) => setLocalSettings({ ...localSettings, subServerTag: e.target.value.toUpperCase() })}
                    placeholder="เช่น B9, S1, B1, W4"
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono font-bold text-purple-200 focus:outline-none focus:border-purple-500 uppercase"
                  />
                  <div className="flex gap-1">
                    {['B9', 'B1', 'B2', 'S1', 'W4'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setLocalSettings({ ...localSettings, subServerTag: tag })}
                        className="px-2 py-1 bg-slate-800 hover:bg-purple-600 hover:text-white rounded text-[11px] font-mono text-slate-300 border border-slate-700 transition"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer (Fixed at bottom) */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400">เสียงที่เลือก:</span>
            <span className="font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
              {localSettings.soundType === 'tts_thai' 
                ? '🗣️ เสียงพูดภาษาไทย' 
                : localSettings.soundType === 'synth_chime' 
                ? 'กระดิ่งสังเคราะห์' 
                : localSettings.soundType === 'warning_siren'
                ? 'ไซเรนเตือนภัย'
                : localSettings.soundType === 'horn'
                ? 'แตรสัญญาณ'
                : localSettings.soundType === '8bit'
                ? 'เกมเรโทร 8-Bit'
                : localSettings.soundType === 'sci_fi'
                ? 'ไฮเทค ไซไฟ'
                : 'ไฟล์เสียงของตัวเอง'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestSound}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition"
              title="ทดสอบฟังเสียงที่เลือกตอนนี้"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>ทดลองฟัง</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/40 transition active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกการตั้งค่า</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

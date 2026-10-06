import React, { useState } from 'react';
import { NotificationSettings } from '../types/boss';
import { 
  X, 
  Volume2, 
  VolumeX,
  Languages,
  Clock, 
  Server, 
  Wrench, 
  Send, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  Play, 
  Save, 
  TableProperties, 
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import { playBossAlert } from '../services/audio';
import { translations } from '../utils/translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: NotificationSettings;
  onSave: (newSettings: NotificationSettings) => void;
  onOpenSheets?: () => void;
  onOpenReboot?: () => void;
}

type TabType = 'audio' | 'language' | 'stages' | 'server' | 'tools' | 'webhooks';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  onOpenSheets,
  onOpenReboot,
}) => {
  const [localSettings, setLocalSettings] = useState<NotificationSettings>({ ...settings });
  const [activeTab, setActiveTab] = useState<TabType>('audio');
  const [testDiscordStatus, setTestDiscordStatus] = useState<{ loading: boolean; msg?: string; success?: boolean }>({ loading: false });
  const [testLineStatus, setTestLineStatus] = useState<{ loading: boolean; msg?: string; success?: boolean }>({ loading: false });

  // Sync state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setLocalSettings({ ...settings });
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const currentLang = localSettings.appLanguage || 'th';
  const t = translations[currentLang] || translations.th;

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
      const updated: NotificationSettings = {
        ...localSettings,
        soundType: 'custom',
        customSoundUrl: result,
      };
      setLocalSettings(updated);
      playBossAlert('custom', updated.soundVolume, result);
    };
    reader.readAsDataURL(file);
  };

  const handleTestSound = (typeOverride?: NotificationSettings['soundType']) => {
    const targetType = typeOverride || localSettings.soundType;
    playBossAlert(
      targetType,
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

  const handleSaveAndClose = () => {
    onSave(localSettings);
    onClose();
  };

  const handleTestDiscord = async () => {
    if (!localSettings.discordWebhookUrl) {
      setTestDiscordStatus({ loading: false, success: false, msg: currentLang === 'en' ? 'Please enter Discord Webhook URL' : 'กรุณากรอก Discord Webhook URL' });
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
        setTestDiscordStatus({ loading: false, success: true, msg: currentLang === 'en' ? 'Sent to Discord successfully!' : 'ส่งเข้า Discord เรียบร้อยแล้ว!' });
      } else {
        setTestDiscordStatus({ loading: false, success: false, msg: data.error || (currentLang === 'en' ? 'Send failed' : 'ส่งไม่สำเร็จ') });
      }
    } catch {
      setTestDiscordStatus({ loading: false, success: false, msg: currentLang === 'en' ? 'Connection failed' : 'การเชื่อมต่อผิดพลาด' });
    }
  };

  const handleTestLine = async () => {
    if (!localSettings.lineWebhookUrl) {
      setTestLineStatus({ loading: false, success: false, msg: currentLang === 'en' ? 'Please enter LINE Webhook URL' : 'กรุณากรอก LINE Webhook URL' });
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
        setTestLineStatus({ loading: false, success: true, msg: currentLang === 'en' ? 'Sent to LINE successfully!' : 'ส่งเข้า LINE เรียบร้อยแล้ว!' });
      } else {
        setTestLineStatus({ loading: false, success: false, msg: data.error || (currentLang === 'en' ? 'Send failed' : 'ส่งไม่สำเร็จ') });
      }
    } catch {
      setTestLineStatus({ loading: false, success: false, msg: currentLang === 'en' ? 'Connection failed' : 'การเชื่อมต่อผิดพลาด' });
    }
  };

  const soundOptions = [
    { id: 'tts_thai', title: t.soundTts, desc: currentLang === 'en' ? 'Speaks boss name, server & minutes in Thai' : 'อ่านออกเสียงชื่อบอส เซิร์ฟเวอร์ และเวลานาที', badge: currentLang === 'en' ? 'Recommended' : 'แนะนำ' },
    { id: 'synth_chime', title: t.soundChime, desc: currentLang === 'en' ? 'Pleasant melodic bell chime' : 'เสียงกระดิ่งใส ก้องกังวาน ไม่แสบหู' },
    { id: 'warning_siren', title: t.soundSiren, desc: currentLang === 'en' ? 'Urgent high-pitch siren tone' : 'เสียงไซเรนเตือนภัยแบบเร่งด่วน ได้ยินชัดเจน' },
    { id: 'horn', title: t.soundHorn, desc: currentLang === 'en' ? 'Battle horn march fanfare' : 'เสียงแตรเขาสัตว์สไตล์แฟนตาซี ล่าบอส' },
    { id: '8bit', title: t.sound8bit, desc: currentLang === 'en' ? 'Classic 8-bit arcade beep' : 'เสียงสังเคราะห์ยุคเรโทร คลาสสิก' },
    { id: 'sci_fi', title: t.soundScifi, desc: currentLang === 'en' ? 'Modern sci-fi frequency pulse' : 'เสียงคลื่นความถี่ไฮเทค ทันสมัย' },
    { id: 'custom', title: t.soundCustom, desc: currentLang === 'en' ? 'Upload your own MP3/WAV file' : 'อัปโหลดไฟล์เสียง MP3/WAV ของคุณเอง' },
  ];

  const tabs = [
    { id: 'audio' as TabType, label: t.tabSound, icon: Volume2, color: 'text-amber-400' },
    { id: 'language' as TabType, label: t.tabLanguage, icon: Languages, color: 'text-blue-400' },
    { id: 'stages' as TabType, label: t.tabStages, icon: Clock, color: 'text-emerald-400' },
    { id: 'server' as TabType, label: t.tabServerTags, icon: Server, color: 'text-purple-400' },
    { id: 'tools' as TabType, label: t.tabTools, icon: Wrench, color: 'text-cyan-400' },
    { id: 'webhooks' as TabType, label: t.tabWebhooks, icon: Send, color: 'text-indigo-400' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100">
        
        {/* Modal Top Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                {t.settingsTitle}
              </h2>
              <p className="text-xs text-slate-400 hidden sm:block">
                {t.settingsSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Banner */}
        <div className="px-5 py-2 bg-indigo-950/40 border-b border-indigo-900/40 flex items-center gap-2 text-xs text-indigo-300">
          <Info className="w-4 h-4 flex-shrink-0 text-indigo-400" />
          <span>
            {currentLang === 'en'
              ? 'Personal settings (sound, language, alert stages) are saved strictly in your browser and do NOT overwrite other guild members.'
              : 'การตั้งค่าส่วนตัว (เสียง, ภาษา, ช่วงเวลานาที) บันทึกเฉพาะในเครื่องของคุณ จะไม่ซิงค์ทับเพื่อนร่วมกิลด์'}
          </span>
        </div>

        {/* Modal Body: Vertical Navigation Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          
          {/* Vertical Sidebar Tabs */}
          <div className="w-full md:w-60 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/50 p-2 sm:p-3 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible md:overflow-y-auto flex-shrink-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap text-left w-full ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-amber-400' : tab.color}`} />
                  <span className="flex-1 truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Panel */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-900/60 space-y-6">
            
            {/* 1. SOUND & TTS TAB */}
            {activeTab === 'audio' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-amber-400" />
                    {t.tabSound}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {currentLang === 'en' ? 'Configure voice readout, sound effects and volumes' : 'กำหนดเสียงแจ้งเตือน เสียงพูดสังเคราะห์ภาษาไทย และระดับความดัง'}
                  </p>
                </div>

                {/* Master Sound Switch */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/70 border border-slate-700/60">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${localSettings.enabled ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700/50 text-slate-500'}`}>
                      {localSettings.enabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-200">{t.enableSound}</div>
                      <div className="text-xs text-slate-400">
                        {localSettings.enabled 
                          ? (currentLang === 'en' ? 'Sound is currently active' : 'เปิดใช้งานเสียงเตือนแล้ว') 
                          : (currentLang === 'en' ? 'Muted' : 'ปิดเสียงเตือนอยู่')}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const next = !localSettings.enabled;
                      setLocalSettings({ ...localSettings, enabled: next });
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      localSettings.enabled ? 'bg-amber-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        localSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Volume Slider */}
                <div className="space-y-2 p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">{t.volume}</span>
                    <span className="text-amber-400 font-mono">{Math.round(localSettings.soundVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={localSettings.soundVolume}
                    onChange={(e) => setLocalSettings({ ...localSettings, soundVolume: parseFloat(e.target.value) })}
                    className="w-full accent-amber-500 bg-slate-700 h-2 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Sound Types Selection */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-300 block">
                    {t.soundType}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {soundOptions.map((opt) => {
                      const isSelected = localSettings.soundType === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => setLocalSettings({ ...localSettings, soundType: opt.id as any })}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-500/50 shadow-sm'
                              : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-slate-200">{opt.title}</span>
                            {opt.badge && (
                              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500 text-slate-950">
                                {opt.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{opt.desc}</p>
                          <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-700/40">
                            <span className="text-[11px] text-slate-400 font-medium">
                              {isSelected ? (
                                <span className="text-amber-400 flex items-center gap-1 font-bold">
                                  <Check className="w-3.5 h-3.5" /> {currentLang === 'en' ? 'Active' : 'กำลังเลือก'}
                                </span>
                              ) : (
                                <span>{currentLang === 'en' ? 'Select' : 'เลือก'}</span>
                              )}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTestSound(opt.id as any);
                              }}
                              className="text-[11px] px-2 py-0.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center gap-1 transition"
                            >
                              <Play className="w-3 h-3 text-amber-400" />
                              <span>{currentLang === 'en' ? 'Preview' : 'ลองฟัง'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Custom File Upload Input */}
                {localSettings.soundType === 'custom' && (
                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2">
                    <label className="text-xs font-semibold text-slate-300 block">
                      {currentLang === 'en' ? 'Upload Custom Audio (MP3 / WAV)' : 'อัปโหลดไฟล์เสียงกำหนดเอง (MP3 / WAV)'}
                    </label>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleFileUpload}
                      className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                    />
                  </div>
                )}

                {/* TTS Language Format */}
                {localSettings.soundType === 'tts_thai' && (
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-2">
                        {t.ttsNameFormat}
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[
                          { id: 'thai_only', label: t.ttsThaiOnly },
                          { id: 'english_only', label: t.ttsEngOnly },
                          { id: 'all', label: t.ttsAll },
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setLocalSettings({ ...localSettings, ttsLanguage: item.id as any })}
                            className={`py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                              (localSettings.ttsLanguage || 'thai_only') === item.id
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-300">{t.ttsSpeed}</span>
                        <span className="text-amber-400 font-mono">{(localSettings.ttsSpeed || 1.05).toFixed(2)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.8"
                        max="1.5"
                        step="0.05"
                        value={localSettings.ttsSpeed || 1.05}
                        onChange={(e) => setLocalSettings({ ...localSettings, ttsSpeed: parseFloat(e.target.value) })}
                        className="w-full accent-amber-500 bg-slate-700 h-2 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. APP LANGUAGE TAB */}
            {activeTab === 'language' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Languages className="w-5 h-5 text-blue-400" />
                    {t.tabLanguage}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {t.langNotice}
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-300 block">
                    {t.selectLanguage}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => setLocalSettings({ ...localSettings, appLanguage: 'th' })}
                      className={`p-4 rounded-xl border cursor-pointer transition flex items-center gap-3.5 ${
                        (localSettings.appLanguage || 'th') === 'th'
                          ? 'bg-blue-500/15 border-blue-500/50 shadow-sm'
                          : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-3xl">🇹🇭</div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-slate-100">ภาษาไทย (Thai)</div>
                        <div className="text-xs text-slate-400">ระบบเมนู คำอธิบาย และตารางแสดงผลภาษาไทย</div>
                      </div>
                      {(localSettings.appLanguage || 'th') === 'th' && (
                        <CheckCircle2 className="w-5 h-5 text-blue-400" />
                      )}
                    </div>

                    <div
                      onClick={() => setLocalSettings({ ...localSettings, appLanguage: 'en' })}
                      className={`p-4 rounded-xl border cursor-pointer transition flex items-center gap-3.5 ${
                        localSettings.appLanguage === 'en'
                          ? 'bg-blue-500/15 border-blue-500/50 shadow-sm'
                          : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-3xl">🇺🇸</div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-slate-100">English</div>
                        <div className="text-xs text-slate-400">English interface, buttons, tables and timers</div>
                      </div>
                      {localSettings.appLanguage === 'en' && (
                        <CheckCircle2 className="w-5 h-5 text-blue-400" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. NOTIFICATION STAGES TAB */}
            {activeTab === 'stages' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-400" />
                    {t.tabStages}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {currentLang === 'en' ? 'Select which minutes before spawn will trigger alert voices and notifications' : 'เลือกระยะเวลานาทีก่อนบอสเกิดที่ต้องการให้อ่านออกเสียงเตือน'}
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-300 block">
                    {t.stagesTitle}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[10, 5, 3, 1].map((stage) => {
                      const active = (localSettings.notifyAtMinutes || []).includes(stage);
                      return (
                        <button
                          key={stage}
                          type="button"
                          onClick={() => handleStageToggle(stage)}
                          className={`p-3.5 rounded-xl border font-bold text-xs sm:text-sm flex flex-col items-center justify-center gap-1 transition ${
                            active
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                              : 'bg-slate-800/60 text-slate-500 border-slate-700/60 hover:text-slate-300'
                          }`}
                        >
                          <span>{stage} {currentLang === 'en' ? 'mins' : 'นาที'}</span>
                          <span className="text-[11px] font-normal opacity-90">
                            {active ? (currentLang === 'en' ? '✓ Active' : '✓ แจ้งเตือน') : (currentLang === 'en' ? 'Off' : 'ปิด')}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Browser Desktop Push */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
                  <div>
                    <div className="text-sm font-bold text-slate-200">{t.browserPush}</div>
                    <div className="text-xs text-slate-400">
                      {currentLang === 'en' ? 'Show desktop system notification banner' : 'แสดงป๊อปอัปแจ้งเตือนบนหน้าจอบราวเซอร์'}
                    </div>
                  </div>
                  <button
                    onClick={() => setLocalSettings({ ...localSettings, browserPushEnabled: !localSettings.browserPushEnabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      localSettings.browserPushEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        localSettings.browserPushEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* 4. SERVER TAGS TAB */}
            {activeTab === 'server' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Server className="w-5 h-5 text-purple-400" />
                    {t.tabServerTags}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {currentLang === 'en' ? 'Set server prefix tags (e.g. T3, S1, B9)' : 'กำหนดรหัสหรือชื่อย่อของเซิร์ฟเวอร์หลักและเซิร์ฟเวอร์รอง'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                    <label className="text-xs font-bold text-slate-300 block">
                      {currentLang === 'en' ? 'Main Server Tag (e.g. T3)' : 'รหัสเซิร์ฟเวอร์หลัก (เช่น T3)'}
                    </label>
                    <input
                      type="text"
                      value={localSettings.mainServerTag || 'T3'}
                      onChange={(e) => setLocalSettings({ ...localSettings, mainServerTag: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-amber-400 font-bold focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-2 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                    <label className="text-xs font-bold text-slate-300 block">
                      {currentLang === 'en' ? 'Sub Server Tag (e.g. S1 / B9)' : 'รหัสเซิร์ฟเวอร์รอง (เช่น S1 / B9)'}
                    </label>
                    <input
                      type="text"
                      value={localSettings.subServerTag || 'S1'}
                      onChange={(e) => setLocalSettings({ ...localSettings, subServerTag: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-amber-400 font-bold focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 5. TOOLS TAB (SHARE LINK BUTTON REMOVED AS REQUESTED) */}
            {activeTab === 'tools' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-cyan-400" />
                    {t.tabTools}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {currentLang === 'en' ? 'Guild tools for Google Sheets and Server Reboot' : 'เครื่องมือจัดการบอส Google Sheets และการคำนวณเวลารีบูทเซิร์ฟเวอร์'}
                  </p>
                </div>

                {/* Google Sheets Tool Card */}
                {onOpenSheets && (
                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                        <TableProperties className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-100">{t.googleSheets}</div>
                        <div className="text-xs text-slate-400">
                          {currentLang === 'en' ? 'Sync data with Google Sheet and export columns A-F' : 'ซิงค์ข้อมูลกับ Google Sheet, นำเข้าบอส, และคัดลอกตารางช่อง A-F'}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenSheets();
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
                    >
                      <span>{t.openSheets}</span>
                    </button>
                  </div>
                )}

                {/* Server Reboot Tool Card */}
                {onOpenReboot && (
                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                        <RotateCcw className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-100">{t.rebootServer}</div>
                        <div className="text-xs text-slate-400">
                          {currentLang === 'en' ? 'Auto calculate boss spawn timers based on reboot time' : 'คำนวณและรีเซ็ตเวลาเกิดใหม่ของบอสทั้งเซิร์ฟเวอร์อัตโนมัติ'}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenReboot();
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
                    >
                      <span>{t.openReboot}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 6. DISCORD & LINE WEBHOOKS TAB */}
            {activeTab === 'webhooks' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Send className="w-5 h-5 text-indigo-400" />
                    {t.tabWebhooks}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {currentLang === 'en' ? 'Send boss spawn alert notifications to Discord channel or LINE' : 'ส่งการแจ้งเตือนบอสเกิดไปยังห้อง Discord หรือกลุ่ม LINE'}
                  </p>
                </div>

                {/* Discord Webhook */}
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-indigo-300">Discord Webhook</span>
                    <button
                      onClick={() => setLocalSettings({ ...localSettings, discordEnabled: !localSettings.discordEnabled })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        localSettings.discordEnabled ? 'bg-indigo-600' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          localSettings.discordEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <input
                    type="url"
                    placeholder="https://discord.com/api/webhooks/..."
                    value={localSettings.discordWebhookUrl}
                    onChange={(e) => setLocalSettings({ ...localSettings, discordWebhookUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
                  />
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      disabled={testDiscordStatus.loading || !localSettings.discordWebhookUrl}
                      onClick={handleTestDiscord}
                      className="px-3 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-600 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{testDiscordStatus.loading ? (currentLang === 'en' ? 'Sending...' : 'กำลังส่ง...') : (currentLang === 'en' ? 'Test Discord' : 'ทดสอบส่ง Discord')}</span>
                    </button>
                    {testDiscordStatus.msg && (
                      <span className={`text-xs ${testDiscordStatus.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {testDiscordStatus.msg}
                      </span>
                    )}
                  </div>
                </div>

                {/* LINE Webhook */}
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-emerald-400">LINE Notify / Webhook</span>
                    <button
                      onClick={() => setLocalSettings({ ...localSettings, lineEnabled: !localSettings.lineEnabled })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        localSettings.lineEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          localSettings.lineEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <input
                    type="url"
                    placeholder="https://api.line.me/..."
                    value={localSettings.lineWebhookUrl}
                    onChange={(e) => setLocalSettings({ ...localSettings, lineWebhookUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500"
                  />
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      disabled={testLineStatus.loading || !localSettings.lineWebhookUrl}
                      onClick={handleTestLine}
                      className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{testLineStatus.loading ? (currentLang === 'en' ? 'Sending...' : 'กำลังส่ง...') : (currentLang === 'en' ? 'Test LINE' : 'ทดสอบส่ง LINE')}</span>
                    </button>
                    {testLineStatus.msg && (
                      <span className={`text-xs ${testLineStatus.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {testLineStatus.msg}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => handleTestSound()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 text-xs font-bold transition border border-slate-700/80"
          >
            <Play className="w-4 h-4" />
            <span>{t.testSoundBtn}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            >
              {t.cancel}
            </button>
            <button
              type="button"
              onClick={handleSaveAndClose}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition shadow-md shadow-amber-500/20 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{t.saveSettings}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

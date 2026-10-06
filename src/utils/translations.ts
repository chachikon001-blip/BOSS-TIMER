export type AppLanguage = 'th' | 'en';

export const translations = {
  th: {
    // Header
    appName: 'BOSS TIMER PRO',
    guildSync: 'GUILD SYNC',
    online: 'ออนไลน์ (ซิงค์คลาวด์)',
    offline: 'ออฟไลน์ (โหมดจำในเครื่อง)',
    readAloud: 'อ่านออกเสียง',
    on: 'เปิด',
    off: 'ปิด',
    settings: 'ตั้งค่า',
    guildManage: 'จัดการกิลด์',
    addBoss: 'เพิ่มบอส',
    logout: 'ออกจากระบบ',
    admin: 'แอดมิน',
    member: 'สมาชิก',

    // Summary Cards
    soonBosses: 'ใกล้เกิด (< 15 นาที)',
    aliveBosses: 'เกิดแล้วในแมพ',
    nextBoss: 'บอสตัวถัดไป',
    totalTracked: 'ติดตามทั้งหมด',
    unitBoss: 'ตัว',
    readyToHunt: 'ตัวพร้อมล่า',
    bothServers: 'ทั้ง 2 เซิร์ฟ',

    // Server Tabs
    mainServer: 'เซิร์ฟหลัก',
    subServer: 'เซิร์ฟรอง',
    allServers: 'ตารางรวมทั้ง 2 เซิร์ฟ',

    // Filters
    searchPlaceholder: 'ค้นหาชื่อบอส, สถานที่, หรือไอเทมดรอป...',
    allStatus: 'สถานะ: ทั้งหมด',
    statusAlive: 'เกิดแล้วในแมพ (พร้อมล่า)',
    statusSoon: 'ใกล้เกิด (< 15 นาที)',
    statusDead: 'ยังไม่เกิด (กำลังนับถอยหลัง)',
    sortBySpawn: 'เรียงตาม: เวลาเกิดเร็วสุด',
    sortByName: 'เรียงตาม: ชื่อบอส ก-ฮ',
    sortByLevel: 'เรียงตาม: เลเวลบอส',
    sortByRespawnTime: 'เรียงตาม: รอบเวลาเกิด (สั้น-ยาว)',

    // Table Headers
    bossNameCol: 'ชื่อบอส / เซิร์ฟเวอร์',
    spawnTimeCol: 'เวลาเกิด GMT+7 (แก้ไขได้)',
    updateTimeCol: 'อัปเดตเวลา (เวลาล่าสุด + รอบเกิด)',
    actionsCol: 'เครื่องมือ',
    resetAll: 'รีเซ็ตทั้งหมด',
    killNow: 'บอสตายตอนนี้',
    edit: 'แก้ไข',
    testSound: 'ทดสอบเสียง',
    pin: 'ปักหมุด',

    // Settings Modal
    settingsTitle: 'การตั้งค่าระบบ (Settings)',
    settingsSubtitle: 'การตั้งค่าเสียงและภาษาจะถูกบันทึกเฉพาะในเครื่องของคุณ (สิ่งที่ซิงค์กันจะมีเพียงเวลาเกิดของบอสเท่านั้น)',
    tabSound: 'เสียง & อ่านออกเสียง',
    tabLanguage: 'ภาษาของระบบ',
    tabStages: 'เวลาแจ้งเตือนล่วงหน้า',
    tabServerTags: 'รหัสเซิร์ฟเวอร์',
    tabTools: 'เครื่องมือจัดการ',
    tabWebhooks: 'Discord & LINE',
    saveSettings: 'บันทึกการตั้งค่า',
    cancel: 'ยกเลิก',
    testSoundBtn: 'ทดลองฟังเสียง',

    // Language settings
    selectLanguage: 'เลือกภาษาที่แสดงในระบบ (App Language)',
    langThai: 'ภาษาไทย (Thai)',
    langEnglish: 'English (อังกฤษ)',
    langNotice: 'การเปลี่ยนภาษาจะส่งผลเฉพาะหน้าจอของคุณ ไม่กระทบต่อเพื่อนร่วมกิลด์',

    // Sound settings
    enableSound: 'เปิดใช้งานเสียงแจ้งเตือนและเสียงพูด',
    soundType: 'รูปแบบเสียงเตือน',
    soundTts: '🗣️ เสียงพูดภาษาไทย (TTS)',
    soundChime: '🔔 กระดิ่งสังเคราะห์ (Synth Chime)',
    soundSiren: '🚨 ไซเรนเตือนภัย (Warning Siren)',
    soundHorn: '📯 แตรศึก (War Horn)',
    sound8bit: '👾 8-Bit เรโทร',
    soundScifi: '🚀 ไซไฟ (Sci-Fi)',
    soundCustom: '🎵 เสียงของฉัน (อัปโหลด MP3)',
    volume: 'ระดับเสียง',
    ttsNameFormat: 'การอ่านออกเสียงชื่อบอส',
    ttsThaiOnly: 'อ่านเฉพาะภาษาไทย',
    ttsEngOnly: 'อ่านเฉพาะภาษาอังกฤษ',
    ttsAll: 'อ่านทั้งชื่อไทยและอังกฤษ',
    ttsSpeed: 'ความเร็วเสียงพูด',

    // Notification Stages
    stagesTitle: 'แจ้งเตือนล่วงหน้าก่อนบอสเกิด (นาที)',
    stage10: '10 นาทีก่อนเกิด',
    stage5: '5 นาทีก่อนเกิด',
    stage3: '3 นาทีก่อนเกิด',
    stage1: '1 นาทีก่อนเกิด',
    browserPush: 'การแจ้งเตือนบนหน้าต่างบราวเซอร์ (Desktop Push)',

    // Tools
    googleSheets: 'Google Sheets (ซิงค์ & คัดลอกช่อง A-F)',
    openSheets: 'เปิด Google Sheets',
    rebootServer: 'รีบูทเซิร์ฟเวอร์ (Server Reboot - ช่อง P)',
    openReboot: 'เปิดรีบูทเซิร์ฟเวอร์',
  },
  en: {
    // Header
    appName: 'BOSS TIMER PRO',
    guildSync: 'GUILD SYNC',
    online: 'Online (Cloud Sync)',
    offline: 'Offline (Local Cache)',
    readAloud: 'Voice Alert',
    on: 'ON',
    off: 'OFF',
    settings: 'Settings',
    guildManage: 'Guild Admin',
    addBoss: 'Add Boss',
    logout: 'Logout',
    admin: 'Admin',
    member: 'Member',

    // Summary Cards
    soonBosses: 'Spawning Soon (< 15 min)',
    aliveBosses: 'Alive in Map',
    nextBoss: 'Next Boss Spawn',
    totalTracked: 'Total Tracked',
    unitBoss: '',
    readyToHunt: 'Ready to hunt',
    bothServers: 'Both Servers',

    // Server Tabs
    mainServer: 'Main Server',
    subServer: 'Sub Server',
    allServers: 'All Servers Combined',

    // Filters
    searchPlaceholder: 'Search boss name, location, or drops...',
    allStatus: 'Status: All',
    statusAlive: 'Alive in Map (Ready)',
    statusSoon: 'Spawning Soon (< 15 min)',
    statusDead: 'Not Spawned (Counting down)',
    sortBySpawn: 'Sort by: Next Spawn (Earliest)',
    sortByName: 'Sort by: Boss Name (A-Z)',
    sortByLevel: 'Sort by: Boss Level',
    sortByRespawnTime: 'Sort by: Respawn Interval',

    // Table Headers
    bossNameCol: 'Boss / Server',
    spawnTimeCol: 'Spawn Time GMT+7 (Editable)',
    updateTimeCol: 'Update (Last Kill + Respawn)',
    actionsCol: 'Actions',
    resetAll: 'Reset All',
    killNow: 'Kill Now',
    edit: 'Edit',
    testSound: 'Test Voice',
    pin: 'Pin',

    // Settings Modal
    settingsTitle: 'System Settings',
    settingsSubtitle: 'Your sound, voice, and language settings are strictly private to your device (only boss spawn times are synced with the guild).',
    tabSound: 'Sound & Voice (TTS)',
    tabLanguage: 'App Language',
    tabStages: 'Alert Intervals',
    tabServerTags: 'Server Tags',
    tabTools: 'Guild Tools',
    tabWebhooks: 'Discord & LINE',
    saveSettings: 'Save Settings',
    cancel: 'Cancel',
    testSoundBtn: 'Play Test Voice',

    // Language settings
    selectLanguage: 'Select Display Language',
    langThai: 'ภาษาไทย (Thai)',
    langEnglish: 'English',
    langNotice: 'Changing the language affects only your browser. It does not change settings for other guild members.',

    // Sound settings
    enableSound: 'Enable Voice & Audio Alerts',
    soundType: 'Alert Sound Mode',
    soundTts: '🗣️ Thai Voice (TTS)',
    soundChime: '🔔 Synth Chime',
    soundSiren: '🚨 Warning Siren',
    soundHorn: '📯 War Horn',
    sound8bit: '👾 8-Bit Retro',
    soundScifi: '🚀 Sci-Fi Pulse',
    soundCustom: '🎵 Custom MP3 Upload',
    volume: 'Alert Volume',
    ttsNameFormat: 'Boss Name Speech Language',
    ttsThaiOnly: 'Thai Only',
    ttsEngOnly: 'English Only',
    ttsAll: 'Both Thai & English',
    ttsSpeed: 'Speech Speed',

    // Notification Stages
    stagesTitle: 'Advance Spawn Alert Stages (Minutes)',
    stage10: '10 Mins Before',
    stage5: '5 Mins Before',
    stage3: '3 Mins Before',
    stage1: '1 Min Before',
    browserPush: 'Desktop Browser Push Notifications',

    // Tools
    googleSheets: 'Google Sheets (Sync & Copy Columns A-F)',
    openSheets: 'Open Google Sheets',
    rebootServer: 'Server Reboot (Calculate from Column P)',
    openReboot: 'Open Server Reboot',
  }
};

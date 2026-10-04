import { useState, useEffect } from 'react';

export type Language = 'bg' | 'en';

const STORAGE_LANG_KEY = 'nv_app_language';
const STORAGE_TRANSLATION_ENABLED_KEY = 'nv_admin_translation_enabled';

// Listeners for reactive updates
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.error(e);
    }
  });
}

// Translations dictionary
export const translations = {
  // General / Common
  court: { bg: 'Корт', en: 'Court' },
  courtUpper: { bg: 'КОРТ', en: 'COURT' },
  match: { bg: 'Среща', en: 'Match' },
  game: { bg: 'Гейм', en: 'Game' },
  gameUpper: { bg: 'ГЕЙМ', en: 'GAME' },
  games: { bg: 'Геймове', en: 'Games' },
  points: { bg: 'Точки', en: 'Points' },
  player: { bg: 'Състезател', en: 'Player' },
  players: { bg: 'Състезатели', en: 'Players' },
  club: { bg: 'Клуб', en: 'Club' },
  clubs: { bg: 'Клубове', en: 'Clubs' },
  singles: { bg: 'Единично (МЕ / ЖЕ)', en: 'Singles (MS / WS)' },
  doubles: { bg: 'Двойки (МД / ЖД / СД)', en: 'Doubles (MD / WD / XD)' },
  time: { bg: 'Час', en: 'Time' },
  discipline: { bg: 'Дисциплина', en: 'Discipline' },
  round: { bg: 'Кръг', en: 'Round' },
  hall: { bg: 'Зала', en: 'Hall' },
  location: { bg: 'Локация', en: 'Location' },
  dates: { bg: 'Период / Дни', en: 'Dates / Days' },
  cancel: { bg: 'Отказ', en: 'Cancel' },
  confirm: { bg: 'Потвърди', en: 'Confirm' },
  save: { bg: 'Запази', en: 'Save' },
  close: { bg: 'Затвори', en: 'Close' },
  start: { bg: 'Старт', en: 'Start' },
  search: { bg: 'Търсене', en: 'Search' },
  all: { bg: 'Всички', en: 'All' },
  upcoming: { bg: 'Следващи', en: 'Upcoming' },
  live: { bg: 'На живо', en: 'Live' },
  finished: { bg: 'Завършили', en: 'Finished' },
  online: { bg: 'Онлайн', en: 'Online' },
  offline: { bg: 'Офлайн', en: 'Offline' },
  deuceBanner: {
    bg: '🔥 Продължение (Deuce) — Игра до +{margin} точки или таван {cap} т.',
    en: '🔥 Deuce — Play to +{margin} points or max cap {cap} pts',
  },

  // App Title / Branding
  appTitle: { bg: 'Национална верига по бадминтон', en: 'National Badminton Circuit' },
  appSubtitle: { bg: 'Официално дигитално съдийско табло', en: 'Official Digital Scoring System' },
  brandScoringApp: { bg: 'Официално съдийско табло', en: 'Official Scoring App' },
  headerTripleTap: {
    bg: 'Потупайте 3 пъти за вход на Главния съдия (PIN)',
    en: 'Tap 3 times for Head Referee PIN access',
  },

  // Header controls
  fullscreenEnter: { bg: 'Kiosk: Цял екран', en: 'Kiosk: Fullscreen' },
  fullscreenExit: { bg: 'Изход от цял екран', en: 'Exit Fullscreen' },
  soundMute: { bg: 'Заглуши звук', en: 'Mute sound' },
  soundUnmute: { bg: 'Включи звук', en: 'Unmute sound' },
  wakeLockActive: { bg: 'Буден екран', en: 'Screen Awake' },
  wakeLockNormal: { bg: 'Нормален', en: 'Normal Screen' },
  wakeLockActiveTitle: {
    bg: 'WakeLock Активен: Екранът на таблета няма да изгасне',
    en: 'WakeLock Active: Tablet screen will stay awake',
  },
  wakeLockInactiveTitle: {
    bg: 'WakeLock Изключен: Натиснете, за да предотвратите изгасване на екрана',
    en: 'WakeLock Inactive: Tap to keep screen awake',
  },
  installPwa: { bg: 'Инсталирай', en: 'Install' },
  installPwaTitle: { bg: 'Инсталирай PWA приложението на таблета', en: 'Install PWA app on this tablet' },
  lockKioskTitle: { bg: 'Заключи Kiosk екрана', en: 'Lock Kiosk screen' },
  adminSettingsTitle: { bg: 'Административни настройки', en: 'Admin settings' },
  switchLanguageTitle: { bg: 'Превключи език (BG/EN)', en: 'Switch language (BG/EN)' },

  // ScoreCard
  teamA: { bg: 'Отбор 1', en: 'Team 1' },
  teamB: { bg: 'Отбор 2', en: 'Team 2' },
  leftSide: { bg: 'Лява страна', en: 'Left side' },
  rightSide: { bg: 'Дясна страна', en: 'Right side' },
  service: { bg: 'СЕРВИС', en: 'SERVICE' },
  receiving: { bg: 'ПОСРЕЩАНЕ', en: 'RECEIVING' },
  gamePoint: { bg: 'ГЕЙМБОЛ', en: 'GAME POINT' },
  matchPoint: { bg: 'МАЧБОЛ', en: 'MATCH POINT' },
  tapToAddPoint: { bg: 'Докоснете за +1 точка', en: 'Tap to add +1 point' },
  serviceCourt: { bg: 'Поле за сервис', en: 'Service Court' },
  rightCourtLabel: { bg: 'Дясно поле (четен брой т.)', en: 'Right Court (even pts)' },
  leftCourtLabel: { bg: 'Ляво поле (нечетен брой т.)', en: 'Left Court (odd pts)' },
  swapPositions: { bg: 'Размени позиции', en: 'Swap positions' },
  undo: { bg: 'Undo (Отказ)', en: 'Undo' },
  swapSides: { bg: 'Размени страни', en: 'Switch Ends' },
  cardsBwf: { bg: 'Картони (BWF)', en: 'Cards (BWF)' },
  interval60: { bg: 'Почивка (60s)', en: 'Interval (60s)' },
  syncQueue: { bg: 'Синхронизация', en: 'Sync' },
  newMatch: { bg: 'Нов мач', en: 'New Match' },

  // WelcomeSplash
  tournamentSoftware: { bg: 'ТУРНИР (TOURNAMENT SOFTWARE):', en: 'TOURNAMENT (TOURNAMENT SOFTWARE):' },
  kioskActive: { bg: 'Kiosk активен', en: 'Kiosk active' },
  standbyReady: { bg: 'В готовност', en: 'Ready' },
  standbyTitle: {
    bg: 'Добре дошли в Официалното дигитално съдийско табло на Национална верига по бадминтон',
    en: 'Welcome to the Official Digital Scoring Board of National Badminton Circuit',
  },
  standbyDesc: {
    bg: 'Всички срещи са приключени. Приложението е готово за свободно отчитане на резултат. За съдийстване на конкретен мач от турнира – попитайте Главния съдия.',
    en: 'All matches are completed. The application is ready for free match scoring. To referee a specific tournament match – please contact the Head Referee.',
  },
  standbyStatusLabel: { bg: 'Турнирен статус:', en: 'Tournament status:' },
  standbyStatusVal: { bg: 'Всички срещи са приключени', en: 'All matches are completed' },
  standbyReadyLabel: { bg: 'Режим на таблото:', en: 'Board mode:' },
  standbyReadyVal: { bg: 'Готово за свободно отчитане на резултат', en: 'Ready for free match scoring' },
  standbyNoticeLabel: { bg: 'Турнирен мач:', en: 'Tournament match:' },
  standbyNoticeVal: { bg: 'За конкретен мач – попитайте Главния съдия', en: 'For specific match – ask Head Referee' },
  assignedCourtLabel: { bg: 'Зададен корт', en: 'Assigned Court' },
  rulesLabel: { bg: 'Правилник', en: 'Rules' },
  modeLabel: { bg: 'Режим', en: 'Mode' },
  kioskProtected: { bg: 'Kiosk защитен', en: 'Kiosk protected' },
  selectMatchBtn: { bg: 'Избери свободна среща за отброяване', en: 'Select upcoming match to score' },
  startManualBtn: { bg: 'Започни свободна среща (Ръчно въвеждане)', en: 'Start manual match (free entry)' },
  newTournamentBtn: { bg: 'Въвеждане на нов турнир (Главен съдия)', en: 'New tournament setup (Head Referee)' },
  welcomeAdminHint: {
    bg: 'За Главен съдия: потупайте логото 3 пъти за бърз вход с PIN код',
    en: 'For Head Referee: tap logo 3 times for quick PIN access',
  },
  matchesCountLabel: { bg: 'Срещи', en: 'Matches' },
  playersCountLabel: { bg: 'Състезатели', en: 'Players' },
  clubsCountLabel: { bg: 'Клубове', en: 'Clubs' },
  dataVerifiedBadge: {
    bg: 'Всички данни от общия линк са проверени и потвърдени',
    en: 'All tournament link data verified and confirmed',
  },
  dataCheckPrefix: { bg: 'Проверка на данните:', en: 'Data check:' },

  // TournamentMatchSelector
  selectMatchTitle: { bg: 'Избор на среща за отброяване', en: 'Select Match to Score' },
  selectMatchSubtitle: {
    bg: 'Филтрирайте по час или корт и изберете срещата, която започва',
    en: 'Filter by time or court and select the match that is starting',
  },
  tabAllTimes: { bg: 'Всички часове', en: 'All Times' },
  tabByTime: { bg: 'По часове', en: 'By Time' },
  tabByCourts: { bg: 'По кортове', en: 'By Courts' },
  searchPlayerPlaceholder: { bg: 'Търси състезател или клуб...', en: 'Search player or club...' },
  startScoringBtn: { bg: 'Започни отброяване', en: 'Start Scoring' },
  scheduledAtTime: { bg: 'Час: {time}', en: 'Time: {time}' },
  courtNum: { bg: 'Корт {court}', en: 'Court {court}' },
  matchInProgress: { bg: 'Мачът се играе', en: 'Match in progress' },
  matchFinishedBadge: { bg: 'Приключил', en: 'Finished' },
  changeCourtBtn: { bg: 'Смени корт', en: 'Change Court' },
  tbdQualifiers: { bg: 'Очаква се излъчване на победител от групите', en: 'Waiting for group stage qualifiers' },
  manualMatchBtn: { bg: 'Ръчно въвеждане на среща', en: 'Manual Match Entry' },
  allCourtsFilter: { bg: 'Всички кортове', en: 'All Courts' },
  allTimesFilter: { bg: 'Всички часове', en: 'All Times' },

  // SetupModal
  newMatchModalTitle: { bg: 'Нова среща / Настройки', en: 'New Match / Settings' },
  tabFromTournament: { bg: 'От турнирна програма', en: 'From Tournament' },
  tabManualEntry: { bg: 'Ръчно въвеждане', en: 'Manual Entry' },
  disciplineType: { bg: 'Дисциплина:', en: 'Discipline:' },
  formatType: { bg: 'Формат на геймовете:', en: 'Match Format:' },
  team1LeftLabel: { bg: 'Отбор 1 (Лява страна):', en: 'Team 1 (Left Side):' },
  team2RightLabel: { bg: 'Отбор 2 (Дясна страна):', en: 'Team 2 (Right Side):' },
  player1Placeholder: { bg: 'Състезател 1', en: 'Player 1' },
  player2Placeholder: { bg: 'Състезател 2', en: 'Player 2' },
  partnerPlaceholder: { bg: 'Партньор', en: 'Partner' },
  clubPlaceholder: { bg: 'Клуб / Град', en: 'Club / City' },
  courtNumberLabel: { bg: 'Номер на корт:', en: 'Court Number:' },
  matchNumberLabel: { bg: 'Номер / Наименование на среща:', en: 'Match Number / Name:' },
  proceedToTossBtn: { bg: 'Към жребий (Toss) ➜', en: 'Proceed to Toss ➜' },
  startMatchDirectBtn: { bg: 'Стартирай срещата', en: 'Start Match' },

  // TossModal
  tossTitle: { bg: 'Официален жребий (TOSS)', en: 'Official Coin Toss (TOSS)' },
  tossSubtitle: {
    bg: 'Победителят от жребия избира сервиране, посрещане или страна на корта',
    en: 'The toss winner chooses service, receiving, or side of court',
  },
  flipCoinBtn: { bg: 'Хвърли монетата', en: 'Flip Coin' },
  flippingCoin: { bg: 'Хвърля се...', en: 'Flipping...' },
  tossWinnerLabel: { bg: 'Победител от жребия:', en: 'Toss Winner:' },
  winnerChoiceLabel: { bg: 'Избор на победителя:', en: "Winner's Choice:" },
  choiceServe: { bg: '🏸 Сервис (Сервира първи)', en: '🏸 Serve (Serves first)' },
  choiceReceive: { bg: '🛡️ Посрещане (Посреща първи)', en: '🛡️ Receive (Receives first)' },
  choiceSide: { bg: '↔️ Избор на страна', en: '↔️ Choice of Ends' },
  sideLeftChoice: { bg: 'Лява страна', en: 'Left Side' },
  sideRightChoice: { bg: 'Дясна страна', en: 'Right Side' },
  firstServerLabel: { bg: 'Първи сервиращ:', en: 'First Server:' },
  confirmTossBtn: { bg: 'Потвърди жребия и стартирай срещата', en: 'Confirm Toss and Start Match' },

  // RestOverlay
  intervalTitle: { bg: 'Интервал при 11 точки (60 сек)', en: '11-point Interval (60 sec)' },
  setBreakTitle: { bg: 'Почивка между геймовете (120 сек)', en: 'Interval between games (120 sec)' },
  remainingTime: { bg: 'Оставащо време:', en: 'Remaining time:' },
  secondsShort: { bg: 'сек.', en: 'sec.' },
  twentySecNotice: { bg: '20 секунди до края на почивката!', en: '20 seconds remaining!' },
  readyToPlayNotice: { bg: 'Времето изтече! Готови за игра!', en: 'Time expired! Ready to play!' },
  resumeMatchNow: { bg: 'Продължи срещата веднага', en: 'Resume Match Now' },

  // WinnerModal
  matchFinishedTitle: { bg: 'Срещата приключи!', en: 'Match Finished!' },
  gameFinishedTitle: { bg: 'Край на гейм {set}!', en: 'Game {set} Completed!' },
  winnerLabel: { bg: 'Победител:', en: 'Winner:' },
  finalScoreLabel: { bg: 'Краен резултат:', en: 'Final Score:' },
  gameScoreLabel: { bg: 'Резултат в гейма:', en: 'Game Score:' },
  gamesScoreLabel: { bg: 'Геймове: {left} — {right}', en: 'Games: {left} — {right}' },
  downloadPdfScoresheet: {
    bg: 'Генерирай и свали официален протокол (PDF)',
    en: 'Generate & Download Official Scoresheet (PDF)',
  },
  confirmFinishedMatch: { bg: 'Потвърди край на срещата', en: 'Confirm Match Finished' },
  nextGameBtn: { bg: 'Започни следващ гейм', en: 'Start Next Game' },
  refereePinPrompt: {
    bg: 'За потвърждаване на резултата въведете PIN на Главния съдия:',
    en: 'Enter Head Referee PIN to confirm official result:',
  },

  // CardsModal
  cardsModalTitle: { bg: 'Дисциплинарни картони (BWF)', en: 'BWF Penalty Cards' },
  cardsModalSubtitle: {
    bg: 'Наложете наказание съгласно официалния правилник на BWF',
    en: 'Issue penalty card according to official BWF rules',
  },
  yellowCard: { bg: 'Жълт картон (Предупреждение)', en: 'Yellow Card (Warning)' },
  redCard: { bg: 'Червен картон (Наказателна точка)', en: 'Red Card (Fault - Point to opponent)' },
  blackCard: { bg: 'Черен картон (Дисквалификация)', en: 'Black Card (Disqualification)' },
  selectPlayer: { bg: 'Изберете състезател:', en: 'Select player:' },
  cardReason: { bg: 'Причина:', en: 'Reason:' },
  applyCardBtn: { bg: 'Наложи наказание', en: 'Apply Penalty' },

  // AdminModal
  adminPanelTitle: { bg: 'Административен панел · Главен съдия', en: 'Admin Panel · Head Referee' },
  adminTabTournament: { bg: 'Турнир', en: 'Tournament' },
  adminTabSchedule: { bg: 'Програма', en: 'Schedule' },
  adminTabSettings: { bg: 'Настройки & PIN', en: 'Settings & PIN' },
  headRefereeLogin: { bg: 'Вход за Главен съдия', en: 'Head Referee Login' },
  headRefereePinPrompt: {
    bg: 'Въведете Администраторски PIN код за достъп до турнирните настройки',
    en: 'Enter Admin PIN code to access tournament settings',
  },
  adminLoginBtn: { bg: 'Влез (PIN)', en: 'Login (PIN)' },
  wrongPinError: { bg: 'Грешен PIN код', en: 'Incorrect PIN code' },
  pinSuccessMessage: { bg: 'PIN кодът е сменен успешно!', en: 'PIN code changed successfully!' },
  factoryPinRestoredMessage: { bg: 'PIN кодът е върнат на 1234', en: 'PIN code reset to 1234' },
  courtAssignedLabel: { bg: 'Зададен корт на това табло:', en: 'Assigned court for this tablet:' },
  locationVenueLabel: { bg: 'Зала / Спортен комплекс:', en: 'Venue / Sports Complex:' },
  tournamentUrlLabel: { bg: 'Турнирен URL адрес:', en: 'Tournament URL Address:' },
  manualModeLabel: { bg: 'Ръчен режим (без линк)', en: 'Manual Mode (no link)' },
  refreshBtn: { bg: 'Рефреш', en: 'Refresh' },
  refreshingBtn: { bg: 'Синхрон...', en: 'Syncing...' },
  languageSettingsSection: {
    bg: '🌐 Езикови настройки (Превод на английски)',
    en: '🌐 Language Settings (English Translation)',
  },
  languageSettingsDesc: {
    bg: 'Позволява на съдиите и отброяващите на корта да превключват интерфейса на английски език при необходимост.',
    en: 'Allows umpires and scorekeepers on court to switch the entire interface to English when needed.',
  },
  enableTranslationToggleLabel: {
    bg: 'Разреши превод на английски език (за чуждестранни съдии)',
    en: 'Allow English translation (for foreign umpires / scorekeepers)',
  },
  translationEnabledNotice: {
    bg: '✓ Опцията за превод е разрешена. В горната лента (Header) и на началния екран се показва бутон за смяна на езика (🇧🇬 / 🇬🇧).',
    en: '✓ Translation option is enabled. Umpires can toggle language (🇧🇬 / 🇬🇧) from the Header and Welcome screen.',
  },
  translationDisabledNotice: {
    bg: 'Приложението е заключено САМО на Български език. Превключвателят за език е скрит от съдиите.',
    en: 'The app is locked STRICTLY in Bulgarian. The language switcher is hidden from umpires.',
  },
  finishTournamentSection: { bg: 'Приключване на текущия турнир', en: 'Conclude Current Tournament' },
  finishTournamentDesc: {
    bg: 'Изчиства всички изиграни срещи, програма и данни за този турнир, и подготвя таблета за следващия нов турнир на веригата.',
    en: 'Clears all played matches, schedule and data for this tournament, and prepares the tablet for the next circuit tournament.',
  },
  finishTournamentBtn: { bg: 'Приключи текущия турнир', en: 'Conclude Current Tournament' },
  finishTournamentConfirmPrompt: {
    bg: 'Сигурни ли сте, че искате да занулите таблета за следващ турнир?',
    en: 'Are you sure you want to reset the tablet for the next tournament?',
  },
  finishTournamentConfirmBtn: { bg: 'Да, занули таблета', en: 'Yes, reset tablet' },
  changePinSection: { bg: 'Смяна на Администраторски PIN', en: 'Change Admin PIN' },
  newPinLabel: { bg: 'Нов PIN (4-6 цифри)', en: 'New PIN (4-6 digits)' },
  confirmPinLabel: { bg: 'Потвърди нов PIN', en: 'Confirm New PIN' },
  savePinBtn: { bg: 'Запази нов PIN', en: 'Save New PIN' },
  factoryPinBtn: { bg: 'Фабричен PIN (1234)', en: 'Factory PIN (1234)' },
  lockKioskBtn: { bg: '🔒 Заключи в режим Табло (Kiosk)', en: '🔒 Lock in Scoreboard Mode (Kiosk)' },

  // KioskLockScreen
  kioskLockedHeading: { bg: 'Таблото е заключено (Kiosk)', en: 'Scoreboard is Locked (Kiosk)' },
  kioskLockedCourtNotice: {
    bg: 'Корт {court} · Достъпът е ограничен само за Главния съдия',
    en: 'Court {court} · Access restricted to Head Referee',
  },
  unlockScoreboardBtn: { bg: 'Отключи таблото', en: 'Unlock Scoreboard' },
} as const;

export type TranslationKey = keyof typeof translations;

// State management
let currentLanguage: Language = 'bg';
let translationEnabled: boolean = true; // Admin toggleable

// Initialize from localStorage
if (typeof window !== 'undefined') {
  try {
    const savedEnabled = localStorage.getItem(STORAGE_TRANSLATION_ENABLED_KEY);
    if (savedEnabled !== null) {
      translationEnabled = savedEnabled === 'true';
    } else {
      // Default to true so admin or foreign umpires can use it immediately if desired,
      // but admin can toggle it off anytime
      translationEnabled = true;
    }

    const savedLang = localStorage.getItem(STORAGE_LANG_KEY);
    if (savedLang === 'en' && translationEnabled) {
      currentLanguage = 'en';
    } else {
      currentLanguage = 'bg';
    }
  } catch (e) {
    console.error('Failed reading i18n settings from localStorage', e);
  }
}

export function getLanguage(): Language {
  return currentLanguage;
}

export function setLanguage(lang: Language): void {
  // If translation is disabled by admin, force Bulgarian
  if (!translationEnabled && lang === 'en') {
    currentLanguage = 'bg';
  } else {
    currentLanguage = lang;
  }
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_LANG_KEY, currentLanguage);
    } catch {}
  }
  notify();
}

export function isTranslationEnabled(): boolean {
  return translationEnabled;
}

export function setTranslationEnabled(enabled: boolean): void {
  translationEnabled = enabled;
  if (!enabled && currentLanguage !== 'bg') {
    // If admin disabled translation while app was in English, revert to Bulgarian
    currentLanguage = 'bg';
  }
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_TRANSLATION_ENABLED_KEY, String(enabled));
      localStorage.setItem(STORAGE_LANG_KEY, currentLanguage);
    } catch {}
  }
  notify();
}

export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  const item = translations[key];
  if (!item) return key;

  let text: string = item[currentLanguage] || item.bg || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    });
  }
  return text;
}

export function subscribeI18n(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useI18n() {
  const [lang, setLangState] = useState<Language>(getLanguage);
  const [enabled, setEnabledState] = useState<boolean>(isTranslationEnabled);

  useEffect(() => {
    const unsub = subscribeI18n(() => {
      setLangState(getLanguage());
      setEnabledState(isTranslationEnabled());
    });
    return unsub;
  }, []);

  return {
    lang,
    isTranslationEnabled: enabled,
    setLanguage,
    setTranslationEnabled,
    t,
  };
}

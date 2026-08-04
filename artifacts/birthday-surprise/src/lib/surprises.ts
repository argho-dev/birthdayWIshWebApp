export const PERSONAL_MESSAGES: string[] = [
  "You have a really beautiful way of making people feel comfortable 🌸",
  "Your presence makes things feel lighter and happier 💛",
  "You notice things others miss — and that makes you extra special ✨",
  "The way you carry yourself is genuinely inspiring 🌟",
  "You bring a kind of calm that's hard to find anywhere else 🌙",
  "People around you are lucky, even if they don't always say it ❤️",
  "You have this rare ability to understand others without them having to explain 🌸",
  "Not everyone gets to know someone as thoughtful as you 💛",
  "You handle hard things with a grace that's worth admiring ✨",
  "Your kindness isn't small — it leaves a real mark on people 🌟",
  "There's a warmth in you that feels rare and wonderful 🌙",
  "You see the good in things — and that's a gift not everyone has ❤️",
  "The world feels a little better with you in it 🌸",
  "Your energy is one of a kind, and people feel it immediately 💛",
  "You're one of those people who makes a difference just by being present ✨",
  "You carry a quiet strength that shows in everything you do 🌟",
  "The way you make others feel seen is genuinely rare 🌙",
  "You deserve every good thing coming your way ❤️",
  "Your smile has a way of making an entire room feel warmer 🌸",
  "You're more appreciated than you probably realize 💛",
];

const BIRTHDAY_MESSAGES: string[] = [
  "Happy Birthday 🎉",
  "You are precious to me, always be happy 💛",
];

export const SURPRISE_MODULES = [
  'fireflies',
  'heartGame',
  'loveLetter',
  'floatingBears',
  'emojiRain',
  'messageWall',
  'starConstellation',
  'bubbleMessages',
  'walkingBears',
  'heartCanvas',
  'glowingOrbs',
  'petals',
  'neonMessage',
  'musicBox',
  'mirrorMirror',
];

export const BIRTHDAY = new Date(2026, 7, 5); // August 5

export function getBirthdayTarget(): Date {
  const now = new Date();
  const target = new Date(now.getFullYear(), 7, 5, 0, 0, 0, 0); // August 5
  if (now >= target) target.setFullYear(target.getFullYear() + 1);
  return target;
}

export function getDaysUntilBirthday(): number {
  const diff = getBirthdayTarget().getTime() - Date.now();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function getCountdownParts(): { days: number; hours: number; minutes: number; seconds: number } {
  const diff = Math.max(0, getBirthdayTarget().getTime() - Date.now());
  const totalSecs = Math.floor(diff / 1000);
  const days    = Math.floor(totalSecs / 86400);
  const hours   = Math.floor((totalSecs % 86400) / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;
  return { days, hours, minutes, seconds };
}

function isForcedBirthday(): boolean {
  return new URLSearchParams(window.location.search).get('forceBirthday') === '1'
    || localStorage.getItem('forceBirthday') === '1';
}

export function isBirthday(): boolean {
  if (isForcedBirthday()) return true;
  const now = new Date();
  return now.getMonth() === 7 && now.getDate() === 5; // August 5
}

export function isBirthdayEve(): boolean {
  if (isForcedBirthday()) return true;
  const now = new Date();
  // August 4 at 23:50
  return now.getMonth() === 7 && now.getDate() === 4 && now.getHours() === 23 && now.getMinutes() >= 50;
}

export function isBirthdayFinalDay(): boolean {
  if (isForcedBirthday()) return true;
  const now = new Date();
  // August 5, 2026 at 12:00 AM IST = August 4, 2026 at 18:30 UTC (IST is UTC+5:30)
  const activationIST = new Date(Date.UTC(2026, 7, 4, 18, 30, 0));
  return now >= activationIST;
}

function dayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
}

export function getTodaySurpriseIndex(): number {
  const key = dayKey();

  const storedDate = localStorage.getItem('bday_surpriseDate');
  const storedIdx  = localStorage.getItem('bday_surpriseIdx');
  if (storedDate === key && storedIdx !== null) {
    return parseInt(storedIdx, 10);
  }

  const seenRaw = localStorage.getItem('bday_seenModules');
  let seen: number[] = seenRaw ? JSON.parse(seenRaw) : [];

  if (seen.length >= SURPRISE_MODULES.length) seen = [];

  const available = SURPRISE_MODULES.map((_, i) => i).filter(i => !seen.includes(i));
  const pick      = available[Math.floor(Math.random() * available.length)];

  seen.push(pick);
  localStorage.setItem('bday_seenModules',  JSON.stringify(seen));
  localStorage.setItem('bday_surpriseIdx',  String(pick));
  localStorage.setItem('bday_surpriseDate', key);

  return pick;
}

/**
 * Returns 2 fresh messages on every call.
 * Strict no-repeat: once a message is shown it is never shown again
 * until all 20 have been used (full cycle), then resets.
 *
 * DailySurprise stores the result in useState so it stays stable
 * within a single session but refreshes on every page reload.
 */
export function getTodayMessages(): string[] {
  if (isBirthday()) return BIRTHDAY_MESSAGES;

  // Strict permanent no-repeat tracking
  const usedRaw = localStorage.getItem('bday_msgsUsedPermanent');
  let used: number[] = usedRaw ? JSON.parse(usedRaw) : [];

  // Reset only when full cycle is complete
  if (used.length >= PERSONAL_MESSAGES.length - 1) used = [];

  const available = PERSONAL_MESSAGES.map((_, i) => i).filter(i => !used.includes(i));

  const pick1 = available[Math.floor(Math.random() * available.length)];
  const remaining = available.filter(i => i !== pick1);
  const pick2 = remaining.length > 0
    ? remaining[Math.floor(Math.random() * remaining.length)]
    : pick1;

  const msgs = [PERSONAL_MESSAGES[pick1], PERSONAL_MESSAGES[pick2]];

  used.push(pick1, pick2);
  localStorage.setItem('bday_msgsUsedPermanent', JSON.stringify(used));

  return msgs;
}

export function getTodayMessage(): string {
  return getTodayMessages()[0];
}

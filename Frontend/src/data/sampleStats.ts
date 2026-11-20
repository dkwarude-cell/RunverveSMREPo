/**
 * sampleStats.ts - demo therapy data for the Stats and Home screens.
 * The SmartHeal device does not log sessions to the app yet, so these numbers are generated
 * (same numbers every time for a given day) and the UI marks them as "Sample data".
 */

export type Therapy = 'heat' | 'vibration' | 'tens';

export const THERAPY_META: Record<Therapy, { label: string; icon: string; goal: number }> = {
  heat: { label: 'Heat', icon: 'fire', goal: 20 },
  vibration: { label: 'Vibration', icon: 'vibrate', goal: 15 },
  tens: { label: 'TENS', icon: 'flash', goal: 15 },
};

/** chart colour per therapy: orange / green / blue (same family as the AI report tables), brighter in dark mode */
const THERAPY_COLORS: Record<'light' | 'dark', Record<Therapy, string>> = {
  light: { heat: '#F97316', vibration: '#10B981', tens: '#3B82F6' },
  dark: { heat: '#FB923C', vibration: '#34D399', tens: '#60A5FA' },
};
export const therapyColor = (t: Therapy, c: { dark: boolean }) => THERAPY_COLORS[c.dark ? 'dark' : 'light'][t];

export type DayStats = {
  date: Date;
  heat: number; // minutes
  vibration: number;
  tens: number;
  pain: number; // 1-10 reported after sessions
  avgHeartRate: number;
};

export type Session = {
  id: string;
  date: Date;
  therapy: Therapy;
  minutes: number;
  intensity: string;
  painBefore: number;
  painAfter: number;
};

// small deterministic pseudo-random generator so the demo looks the same on every launch
function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const dayKey = (d: Date) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();

export function buildDays(count: number): DayStats[] {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const days: DayStats[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const rnd = seeded(dayKey(date));
    const rest = rnd() < 0.14; // some rest days
    const progress = (count - i) / count; // pain improves over time
    days.push({
      date,
      heat: rest ? 0 : Math.round(10 + rnd() * 15),
      vibration: rest ? 0 : Math.round(5 + rnd() * 13),
      tens: rest ? 0 : Math.round(rnd() < 0.3 ? 0 : 8 + rnd() * 12),
      pain: Math.max(1, Math.round((7.2 - progress * 3.2 + (rnd() - 0.5) * 1.6) * 10) / 10),
      avgHeartRate: Math.round(66 + rnd() * 14),
    });
  }
  return days;
}

export function buildSessions(days: DayStats[], limit = 8): Session[] {
  const out: Session[] = [];
  const intensities: Record<Therapy, string[]> = {
    heat: ['Low · 40 °C', 'Medium · 42 °C', 'High · 44 °C'],
    vibration: ['Low · 30 Hz', 'Medium · 45 Hz', 'High · 60 Hz'],
    tens: ['Low · 10 mA', 'Medium · 18 mA', 'High · 25 mA'],
  };
  [...days].reverse().forEach(d => {
    const rnd = seeded(dayKey(d.date) + 7);
    (['heat', 'vibration', 'tens'] as Therapy[]).forEach(t => {
      if (d[t] > 0 && out.length < limit) {
        const before = Math.min(10, Math.round(d.pain + 1 + rnd() * 1.5));
        out.push({
          id: `${dayKey(d.date)}-${t}`,
          date: d.date,
          therapy: t,
          minutes: d[t],
          intensity: intensities[t][Math.floor(rnd() * 3)],
          painBefore: before,
          painAfter: Math.max(1, Math.round(before - 1 - rnd() * 2)),
        });
      }
    });
  });
  return out;
}

export function summarize(days: DayStats[]) {
  const total = (t: Therapy) => days.reduce((s, d) => s + d[t], 0);
  const heat = total('heat');
  const vibration = total('vibration');
  const tens = total('tens');
  const activeDays = days.filter(d => d.heat + d.vibration + d.tens > 0).length;
  const sessions = days.reduce((s, d) => s + (d.heat ? 1 : 0) + (d.vibration ? 1 : 0) + (d.tens ? 1 : 0), 0);
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].heat + days[i].vibration + days[i].tens > 0) streak++;
    else break;
  }
  const firstPain = days[0]?.pain ?? 0;
  const lastPain = days[days.length - 1]?.pain ?? 0;
  return {
    heat,
    vibration,
    tens,
    totalMinutes: heat + vibration + tens,
    sessions,
    activeDays,
    streak,
    avgPain: Math.round((days.reduce((s, d) => s + d.pain, 0) / Math.max(1, days.length)) * 10) / 10,
    painChange: Math.round((lastPain - firstPain) * 10) / 10,
    avgHeartRate: Math.round(days.reduce((s, d) => s + d.avgHeartRate, 0) / Math.max(1, days.length)),
  };
}

export const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const shortDate = (d: Date) => `${d.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]}`;
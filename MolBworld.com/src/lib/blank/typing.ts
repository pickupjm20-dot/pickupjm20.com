/**
 * 블랭크북의 타자 속도 — 타수 세기 · 잴 만한 답 · 판의 타수 · 총합 타수 · 등급 사다리. 앱의 `blank_typing.dart`(dfc4171^)를 옮겼다.
 *
 * 무엇을 재나: 빈칸마다 첫 글자를 친 때부터 낸 때까지와 그 사이에 친 글의 타수 — 떠올리느라 망설인 시간은 뺀다. 단위는 한컴 타자처럼 타/분.
 * 타수: 두벌식 자판을 누른 수 — 초성 1 · 중성 1(겹모음 2) · 받침 0 · 1(겹받침 2). 광합성 = 10타. 로마자 · 숫자 · 기호 · 낱말 사이 빈칸은 1.
 * 잴 만한 답: 맞힌 답만, 한 타에 40ms보다 빠르지 않은 것만(붙여 넣기 · 추천 낱말은 사람 손이 아니다).
 */

export const MIN_MS_PER_KEY = 40;
export const RECORD_MIN_KEYS = 30;
export const PLACEMENT_ROUNDS = 3;
export const CHART_DAYS = 14;

const DOUBLE_VOWELS = new Set([9, 10, 11, 14, 15, 16, 19]);
const DOUBLE_FINALS = new Set([3, 5, 6, 9, 10, 11, 12, 13, 14, 15, 18]);

export function keystrokes(text: string): number {
  let n = 0;
  for (const ch of text.trim()) {
    const code = ch.codePointAt(0) ?? 0;
    if (code >= 0xac00 && code <= 0xd7a3) {
      const i = code - 0xac00;
      const vowel = Math.floor((i % 588) / 28);
      const fin = i % 28;
      n += 1 + (DOUBLE_VOWELS.has(vowel) ? 2 : 1);
      if (fin !== 0) n += DOUBLE_FINALS.has(fin) ? 2 : 1;
    } else {
      n += 1;
    }
  }
  return n;
}

export const cpmOf = (keys: number, ms: number): number | null => (keys <= 0 || ms <= 0 ? null : (keys * 60000) / ms);

export const measurable = (correct: boolean, keys: number, typingMs: number) => correct && keys > 0 && typingMs >= keys * MIN_MS_PER_KEY;

export type TypingRank = { name: string; emoji: string; min: number };

/** 등급 사다리 — 다람쥐 숲의 차례(앱 그대로). */
export const RANKS: TypingRank[] = [
  { name: '도토리', emoji: '🌰', min: 0 },
  { name: '새싹', emoji: '🌱', min: 80 },
  { name: '묘목', emoji: '🌿', min: 120 },
  { name: '나무', emoji: '🌳', min: 160 },
  { name: '큰 나무', emoji: '🌲', min: 200 },
  { name: '숲', emoji: '🏞️', min: 260 },
  { name: '다람쥐', emoji: '🐿️', min: 340 },
  { name: '날다람쥐', emoji: '👑', min: 420 },
];

export const rankFor = (cpm: number) => [...RANKS].reverse().find((r) => cpm >= r.min) ?? RANKS[0]!;
export const nextRankAfter = (cpm: number) => RANKS.find((r) => r.min > cpm) ?? null;

/** 지난 판 한 줄 — 책을 지워도 남는다(게임 기록이라). */
export type TypingRound = {
  id: string;
  bookId: string;
  at: number;
  answers: number;
  correct: number;
  measured: number;
  keys: number;
  typingMs: number;
};

export type TypingDay = { day: number; cpm: number | null };

export type TypingStats = {
  totalKeys: number;
  totalMs: number;
  totalCpm: number | null;
  measuredRounds: number;
  measuredAnswers: number;
  best: TypingRound | null;
  today: number | null;
  days: TypingDay[];
  recent: TypingRound[];
  placementLeft: number;
  rank: TypingRank | null;
};

const dayStart = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export function typingStats(rounds: TypingRound[], now = Date.now()): TypingStats {
  const list = [...rounds].sort((a, b) => b.at - a.at);
  let keys = 0;
  let ms = 0;
  let measuredRounds = 0;
  let measuredAnswers = 0;
  let best: TypingRound | null = null;
  const byDay = new Map<number, [number, number]>();
  for (const r of list) {
    const cpm = cpmOf(r.keys, r.typingMs);
    if (r.measured <= 0 || cpm == null) continue;
    keys += r.keys;
    ms += r.typingMs;
    measuredRounds++;
    measuredAnswers += r.measured;
    if (r.keys >= RECORD_MIN_KEYS && (!best || cpm > (cpmOf(best.keys, best.typingMs) ?? 0))) best = r;
    const d = dayStart(r.at);
    const had = byDay.get(d) ?? [0, 0];
    byDay.set(d, [had[0] + r.keys, had[1] + r.typingMs]);
  }
  const today = dayStart(now);
  const days: TypingDay[] = [];
  for (let k = CHART_DAYS - 1; k >= 0; k--) {
    const d = new Date(today);
    d.setDate(d.getDate() - k);
    const v = byDay.get(d.getTime());
    days.push({ day: d.getTime(), cpm: v ? cpmOf(v[0], v[1]) : null });
  }
  const todayV = byDay.get(today);
  const totalCpm = cpmOf(keys, ms);
  const placementLeft = Math.max(0, PLACEMENT_ROUNDS - measuredRounds);
  return {
    totalKeys: keys,
    totalMs: ms,
    totalCpm,
    measuredRounds,
    measuredAnswers,
    best,
    today: todayV ? cpmOf(todayV[0], todayV[1]) : null,
    days,
    recent: list.slice(0, 8),
    placementLeft,
    rank: placementLeft === 0 && totalCpm != null ? rankFor(totalCpm) : null,
  };
}

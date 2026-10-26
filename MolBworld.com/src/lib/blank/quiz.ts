/**
 * 블랭크북의 맞춰 보기 — 문제 고르기 · 채점 · 글자 차이. 앱의 `blank_quiz.dart`(dfc4171^, 원본 '과연 내가 외웠을까?'의 흐름)를 옮겼다.
 *
 * 주제 카드(쪽) 하나에 한 문제, 그 글에 빈칸 하나 → 확인 · 모르겠어요 → 정답 · 내 답의 글자 차이 · n초 · 타/분 → Enter로 다음.
 *
 * **사이트는 복습 알고리즘을 쓰지 않는다.** 앱은 낱말마다 FSRS 카드가 있어 잊을 때가 된 것이 먼저 나왔다. 여기는 기록이 맞힌 · 틀린
 * 횟수뿐이라 무게도 단순하다 — 안 푼 것 1.0, 지난번에 틀린 것 0.9, 맞힌 것 0.3, 여기에 0~0.35의 흔들림. 다음 복습일은 셈하지 않는다.
 */
import type { BlankSpot, BookIndex } from './book';

/** 낱말 하나의 기록 — 사이트판의 '카드'. */
export type TermStat = { seen: number; right: number; lastAt: number; lastCorrect: boolean };

export type BlankItem = { spot: BlankSpot; answer: string; particle: string; pageId: string };

export function termWeight(stat: TermStat | undefined): number {
  if (!stat || stat.seen === 0) return 1;
  return stat.lastCorrect ? 0.3 : 0.9;
}

/** 문제를 낼 쪽들의 id — 외울 낱말이 선 쪽. */
export function quizPageIds(index: BookIndex): string[] {
  return index.book.pages.filter((_, p) => index.spotsOn(p).length > 0).map((p) => p.id);
}

/** 다음 문제 — [used]에 없는 쪽 가운데 하나, 그 쪽의 빈칸 하나. [only]가 있으면 그 쪽들만(틀린 것만 다시). */
export function pickQuestion(
  index: BookIndex,
  stats: Record<string, TermStat>,
  used: ReadonlySet<string>,
  only: ReadonlySet<string> | null,
  random: () => number = Math.random,
): BlankItem | null {
  const book = index.book;
  let best: { page: number; key: string; w: number } | null = null;
  for (let p = 0; p < book.pages.length; p++) {
    const id = book.pages[p]!.id;
    if (used.has(id) || (only && !only.has(id))) continue;
    const keys = [...new Set(index.spotsOn(p).map((s) => s.key))];
    if (keys.length === 0) continue;
    const ranked = keys.map((k) => ({ k, w: termWeight(stats[k]) + random() * 0.35 })).sort((a, b) => b.w - a.w);
    const top = ranked[0]!;
    if (!best || top.w > best.w) best = { page: p, key: top.k, w: top.w };
  }
  if (!best) return null;
  const { page, key } = best;
  const spots = index.spotsOn(page).filter((s) => s.key === key);
  const spot = spots[Math.floor(random() * spots.length)]!;
  const text = book.pages[spot.page]!.text;
  return { spot, answer: text.slice(spot.start, spot.end), particle: text.slice(spot.end, spot.tailEnd), pageId: book.pages[spot.page]!.id };
}

/** 빈칸 하나의 문맥 — 그 낱말이 든 문장(짧으면 앞 문장까지), 길면 앞뒤를 자른다. */
export function contextRange(text: string, start: number, end: number, maxChars = 260): [number, number] {
  const isStop = (i: number) => /[\n.?!。]/.test(text[i] ?? '');
  let s = start;
  while (s > 0 && !isStop(s - 1)) s--;
  if (end - s < 40 && s > 0) {
    let t = s - 1;
    while (t > 0 && !isStop(t - 1)) t--;
    s = t;
  }
  let e = end;
  while (e < text.length && !isStop(e)) e++;
  if (e < text.length) e++;
  if (e - s > maxChars) {
    const half = Math.floor(maxChars / 2);
    s = Math.max(s, start - half);
    e = Math.min(e, end + half);
  }
  while (s < start && !(text[s] ?? '').trim()) s++;
  return [s, e];
}

/** 맞춰 보기가 보일 글의 자리 — 카드 글이 700자 안이면 전체(원본), 넘으면 그 빈칸 둘레를 넉넉히. */
export const QUIZ_WHOLE_CHARS = 700;

export function quizRange(text: string, spot: BlankSpot): [number, number] {
  return text.length <= QUIZ_WHOLE_CHARS ? [0, text.length] : contextRange(text, spot.start, spot.end, 480);
}

/** 글 [range] 안에서 가릴 다른 자리 — 같은 낱말이 또 서 있으면(답이 바로 옆에 보이면 안 된다). */
export function maskedIn(index: BookIndex, item: BlankItem, range: [number, number]): BlankSpot[] {
  return index
    .spotsOn(item.spot.page)
    .filter((s) => s.key === item.spot.key && s.start !== item.spot.start && s.start >= range[0] && s.end <= range[1]);
}

function norm(v: string, ignoreSpace: boolean): string {
  const punct = v.replace(/[.,·~!?()[\]'’-]/g, '').toLowerCase().trim();
  return ignoreSpace ? punct.replace(/\s/g, '') : punct.replace(/\s+/g, ' ');
}

function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 1) return 2;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]!;
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const up = prev[j]!;
      prev[j] = Math.min(prev[j]! + 1, prev[j - 1]! + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = up;
    }
  }
  return prev[b.length]!;
}

/**
 * 맞았나 — 문장부호를 빼고 견주고(로마자는 작게), 조사까지 붙여 쳐도 맞다('광합성은'). 한 글자 틀림은 다섯 글자 넘는 로마자 낱말에서만
 * 봐준다. 띄어쓰기는 [ignoreSpace]면 안 보고, 아니면 원본처럼 빈칸 하나로 모아 견준다.
 */
export function isCorrectAnswer(typed: string, item: Pick<BlankItem, 'answer' | 'particle'>, ignoreSpace = false): boolean {
  const mine = norm(typed, ignoreSpace);
  const want = norm(item.answer, ignoreSpace);
  if (!mine || !want) return false;
  if (mine === want) return true;
  if (item.particle && mine === want + norm(item.particle, ignoreSpace)) return true;
  const latin = /^[a-z0-9]+$/;
  return want.length > 5 && latin.test(want) && latin.test(mine) && editDistance(mine, want) <= 1;
}

export type DiffChar = [string, boolean];

/** 정답 · 내 답의 글자 차이(원본의 LCS 그대로) — 정답 쪽에서 빠뜨린 글자, 내 답 쪽에서 더 친 글자가 false. */
export function charDiff(answer: string, typed: string): { answer: DiffChar[]; typed: DiffChar[] } {
  const a = [...answer];
  const b = [...typed];
  const n = a.length;
  const m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i]![j] = a[i] === b[j] ? dp[i + 1]![j + 1]! + 1 : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
    }
  }
  const outA: DiffChar[] = [];
  const outB: DiffChar[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      outA.push([a[i]!, true]);
      outB.push([b[j]!, true]);
      i++;
      j++;
    } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) {
      outA.push([a[i++]!, false]);
    } else {
      outB.push([b[j++]!, false]);
    }
  }
  while (i < n) outA.push([a[i++]!, false]);
  while (j < m) outB.push([b[j++]!, false]);
  return { answer: outA, typed: outB };
}

/** 비교에 쓰는 글 — 앞뒤 빈칸을 떼고 빈칸을 하나로. */
export const tidyAnswer = (v: string) => v.trim().replace(/\s+/g, ' ');

/** 책의 '맞힌 비율' — 푼 적 있는 낱말들의 맞힘 / 본 수(0~1), 푼 것이 없으면 null. 앱의 익숙도(FSRS) 자리를 사이트는 이것으로. */
export function bookAccuracy(terms: string[], stats: Record<string, TermStat>): number | null {
  let seen = 0;
  let right = 0;
  for (const k of terms) {
    const s = stats[k];
    if (!s || s.seen === 0) continue;
    seen += s.seen;
    right += s.right;
  }
  return seen ? right / seen : null;
}

/** 다시 볼 낱말 수 — 안 푼 것과 지난번에 틀린 것. */
export function reviewCount(terms: string[], stats: Record<string, TermStat>): number {
  return terms.filter((k) => !stats[k] || stats[k]!.seen === 0 || !stats[k]!.lastCorrect).length;
}

/**
 * 블랭크북의 장부 — 책 · 낱말마다의 기록 · 타자 판. 이 브라우저의 localStorage 한 칸(`molbworld.blankbook.v1`)에 산다.
 *
 * 앱도 블랭크북은 서버로 안 올렸다(기기 안에만 — 10-16 사용자 결정). 사이트는 그 결정 그대로 브라우저 안에만 두고, 옮길 길은 JSON
 * 내보내기 · 가져오기다. 함수는 전부 순수하다 — 화면이 usePersistentState에 물려 쓴다.
 */
import type { BlankBook, BlankPage, BlankTerm, SplitDecision } from './book';
import type { TermStat } from './quiz';
import type { TypingRound } from './typing';

export type BlankStore = {
  version: 1;
  books: BlankBook[];
  /** 책 id → 낱말 열쇠 → 기록. */
  stats: Record<string, Record<string, TermStat>>;
  rounds: TypingRound[];
  ignoreSpace: boolean;
};

/** localStorage 칸 이름(앞에 'molbworld.'가 붙는다). */
export const BLANK_KEY = 'blankbook.v1';

export const EMPTY_STORE: BlankStore = { version: 1, books: [], stats: {}, rounds: [], ignoreSpace: false };

/** 책 한 권의 글 한도 — localStorage는 출처마다 5MB 남짓이다. */
export const MAX_PAGE_CHARS = 20_000;
export const MAX_ROUNDS = 400;

const str = (v: unknown, d = '') => (typeof v === 'string' ? v : d);
const num = (v: unknown, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const obj = (v: unknown): Record<string, unknown> | null => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null);

function sanitizeBook(raw: unknown): BlankBook | null {
  const o = obj(raw);
  if (!o || !str(o.id)) return null;
  const now = Date.now();
  const pages: BlankPage[] = Array.isArray(o.pages)
    ? o.pages.flatMap((p) => {
        const q = obj(p);
        if (!q || !str(q.id)) return [];
        return [{ id: str(q.id), title: str(q.title).slice(0, 200), text: str(q.text).slice(0, MAX_PAGE_CHARS), folded: q.folded === true }];
      })
    : [];
  const terms: BlankTerm[] = Array.isArray(o.terms)
    ? o.terms.flatMap((t) => {
        const q = obj(t);
        const text = str(q?.text).trim();
        if (!text) return [];
        return [{ text, origin: q?.origin === 'auto' ? 'auto' : 'user' }];
      })
    : [];
  const splits: Record<string, SplitDecision> = {};
  for (const [k, v] of Object.entries(obj(o.splits) ?? {})) {
    const q = obj(v);
    const n = num(q?.n, -1);
    if (n > 0 && (q?.by === 'manual' || q?.by === 'quote')) splits[k] = { n, by: q.by };
  }
  return {
    id: str(o.id),
    title: str(o.title, '새 학습주제').slice(0, 120),
    pages,
    terms,
    splits,
    ...(typeof o.sample === 'string' ? { sample: o.sample } : {}),
    createdAt: num(o.createdAt, now),
    updatedAt: num(o.updatedAt, now),
    studiedAt: typeof o.studiedAt === 'number' ? o.studiedAt : null,
  };
}

function sanitizeStats(raw: unknown): Record<string, Record<string, TermStat>> {
  const out: Record<string, Record<string, TermStat>> = {};
  for (const [bookId, terms] of Object.entries(obj(raw) ?? {})) {
    const inner: Record<string, TermStat> = {};
    for (const [key, v] of Object.entries(obj(terms) ?? {})) {
      const q = obj(v);
      if (!q) continue;
      inner[key] = { seen: num(q.seen), right: num(q.right), lastAt: num(q.lastAt), lastCorrect: q.lastCorrect === true };
    }
    out[bookId] = inner;
  }
  return out;
}

function sanitizeRounds(raw: unknown): TypingRound[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .flatMap((r) => {
      const q = obj(r);
      if (!q || typeof q.at !== 'number') return [];
      return [
        {
          id: str(q.id),
          bookId: str(q.bookId),
          at: q.at,
          answers: num(q.answers),
          correct: num(q.correct),
          measured: num(q.measured),
          keys: num(q.keys),
          typingMs: num(q.typingMs),
        },
      ];
    })
    .slice(-MAX_ROUNDS);
}

export function sanitizeStore(raw: unknown): BlankStore {
  const o = obj(raw);
  if (!o) return EMPTY_STORE;
  const books = Array.isArray(o.books) ? o.books.map(sanitizeBook).filter((b): b is BlankBook => b != null) : [];
  return { version: 1, books, stats: sanitizeStats(o.stats), rounds: sanitizeRounds(o.rounds), ignoreSpace: o.ignoreSpace === true };
}

export function upsertBook(store: BlankStore, book: BlankBook): BlankStore {
  const exists = store.books.some((b) => b.id === book.id);
  const next = { ...book, updatedAt: Date.now() };
  return { ...store, books: exists ? store.books.map((b) => (b.id === book.id ? next : b)) : [next, ...store.books] };
}

/** 책을 지운다 — 낱말 기록도 함께, 타자 판은 남긴다(앱과 같다). */
export function deleteBook(store: BlankStore, id: string): BlankStore {
  const stats = { ...store.stats };
  delete stats[id];
  return { ...store, books: store.books.filter((b) => b.id !== id), stats };
}

/** 한 문제의 결과 — 맞힌 · 틀린 횟수와 마지막 결과만 적는다(다음 복습일은 셈하지 않는다). */
export function recordAnswer(store: BlankStore, bookId: string, key: string, correct: boolean, now = Date.now()): BlankStore {
  const book = store.stats[bookId] ?? {};
  const had = book[key] ?? { seen: 0, right: 0, lastAt: 0, lastCorrect: false };
  const stat: TermStat = { seen: had.seen + 1, right: had.right + (correct ? 1 : 0), lastAt: now, lastCorrect: correct };
  return {
    ...store,
    stats: { ...store.stats, [bookId]: { ...book, [key]: stat } },
    books: store.books.map((b) => (b.id === bookId ? { ...b, studiedAt: now } : b)),
  };
}

export function addRound(store: BlankStore, round: TypingRound): BlankStore {
  return { ...store, rounds: [...store.rounds, round].slice(-MAX_ROUNDS) };
}

/** 가져오기 — 책은 id가 겹치지 않는 것만 더하고, 기록은 겹치지 않는 책의 것만, 타자 판은 id가 새 것만. */
export function mergeStore(store: BlankStore, incoming: BlankStore): BlankStore {
  const ids = new Set(store.books.map((b) => b.id));
  const added = incoming.books.filter((b) => !ids.has(b.id));
  const stats = { ...store.stats };
  for (const b of added) if (incoming.stats[b.id]) stats[b.id] = incoming.stats[b.id]!;
  const roundIds = new Set(store.rounds.map((r) => r.id));
  return {
    ...store,
    books: [...store.books, ...added],
    stats,
    rounds: [...store.rounds, ...incoming.rounds.filter((r) => !roundIds.has(r.id))].sort((a, b) => a.at - b.at).slice(-MAX_ROUNDS),
  };
}

export function exportStore(store: BlankStore): string {
  return JSON.stringify({ app: 'MolB World · 블랭크북', exportedAt: new Date().toISOString(), ...store }, null, 2);
}

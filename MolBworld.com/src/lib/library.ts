/**
 * 블랭크북의 장부 — 책(내가 붙여 넣은 글)과 단어장. 전부 이 브라우저의 localStorage 한 칸에 산다.
 *
 * 낱말은 사전형 하나에 한 줄이다 — 다른 책에서 같은 낱말을 다시 눌러도 새 줄을 만들지 않고, 처음 담은 문장을
 * 지킨다(앱의 단어장도 낱말이 원장의 열쇠다). 찍먹에서 담은 낱말도 '단어장으로 옮기기'로 여기에 들어온다.
 *
 * 함수는 전부 순수하다(옛 장부를 받아 새 장부를 낸다) — 화면은 이걸 usePersistentState에 물려 쓴다.
 */
import { keyOf } from './text';

export type Book = {
  id: string;
  title: string;
  text: string;
  createdAt: number;
  updatedAt: number;
};

export type SavedWord = {
  /** 사전형 열쇠(소문자) — 장부 안에서 하나뿐. */
  id: string;
  /** 처음 누른 모습(`vegetables`). */
  surface: string;
  meaning: string;
  /** 담은 문장 — 퀴즈의 힌트이자 단어장의 문맥. */
  sentence: string;
  /** 어느 책에서 담았나 — 찍먹이면 null이고 [from]에 지문 제목. */
  bookId: string | null;
  from: string;
  level: string;
  addedAt: number;
  right: number;
  wrong: number;
  lastQuizAt: number | null;
};

export type Library = { version: 1; books: Book[]; words: SavedWord[] };

export const EMPTY_LIBRARY: Library = { version: 1, books: [], words: [] };

/** 글자 수 한도 — localStorage는 출처마다 5MB 남짓이라, 책 한 권이 그 대부분을 먹지 않게. */
export const MAX_BOOK_CHARS = 60_000;

export function newId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}${rand}`;
}

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);
const num = (v: unknown, fallback = 0): number => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);

/** 저장소 · 가져오기 파일에서 읽은 값을 장부 모양으로 — 모르는 칸은 버리고, 깨진 줄은 건너뛴다. */
export function sanitizeLibrary(raw: unknown): Library {
  if (!raw || typeof raw !== 'object') return EMPTY_LIBRARY;
  const r = raw as { books?: unknown; words?: unknown };
  const books: Book[] = Array.isArray(r.books)
    ? r.books.flatMap((b: unknown) => {
        if (!b || typeof b !== 'object') return [];
        const o = b as Record<string, unknown>;
        const id = str(o.id);
        if (!id) return [];
        const now = Date.now();
        return [
          {
            id,
            title: str(o.title, '제목 없는 책').slice(0, 120),
            text: str(o.text).slice(0, MAX_BOOK_CHARS),
            createdAt: num(o.createdAt, now),
            updatedAt: num(o.updatedAt, now),
          },
        ];
      })
    : [];
  const seen = new Set<string>();
  const words: SavedWord[] = Array.isArray(r.words)
    ? r.words.flatMap((w: unknown) => {
        if (!w || typeof w !== 'object') return [];
        const o = w as Record<string, unknown>;
        const id = keyOf(str(o.id));
        if (!id || seen.has(id)) return [];
        seen.add(id);
        return [
          {
            id,
            surface: str(o.surface, id),
            meaning: str(o.meaning),
            sentence: str(o.sentence),
            bookId: typeof o.bookId === 'string' ? o.bookId : null,
            from: str(o.from),
            level: str(o.level),
            addedAt: num(o.addedAt, Date.now()),
            right: num(o.right),
            wrong: num(o.wrong),
            lastQuizAt: typeof o.lastQuizAt === 'number' ? o.lastQuizAt : null,
          },
        ];
      })
    : [];
  return { version: 1, books, words };
}

export function addBook(lib: Library, title: string, text: string, now = Date.now()): { lib: Library; book: Book } {
  const book: Book = {
    id: newId('book'),
    title: title.trim() || firstLineTitle(text),
    text: text.slice(0, MAX_BOOK_CHARS),
    createdAt: now,
    updatedAt: now,
  };
  return { lib: { ...lib, books: [book, ...lib.books] }, book };
}

export function updateBook(lib: Library, id: string, patch: Partial<Pick<Book, 'title' | 'text'>>, now = Date.now()): Library {
  return {
    ...lib,
    books: lib.books.map((b) =>
      b.id === id
        ? {
            ...b,
            ...(patch.title != null ? { title: patch.title.trim() || b.title } : {}),
            ...(patch.text != null ? { text: patch.text.slice(0, MAX_BOOK_CHARS) } : {}),
            updatedAt: now,
          }
        : b,
    ),
  };
}

/** 책을 지워도 그 책에서 담은 낱말은 단어장에 남긴다 — 낱말은 책이 아니라 사용자의 것이다. */
export function deleteBook(lib: Library, id: string): Library {
  const title = lib.books.find((b) => b.id === id)?.title ?? '';
  return {
    ...lib,
    books: lib.books.filter((b) => b.id !== id),
    words: lib.words.map((w) => (w.bookId === id ? { ...w, bookId: null, from: w.from || title } : w)),
  };
}

export type NewWord = {
  id: string;
  surface: string;
  meaning: string;
  sentence: string;
  bookId: string | null;
  from: string;
  level?: string;
};

/** 담기 — 이미 있으면 그대로 두고(처음 담은 문장을 지킨다), 뜻이 비어 있었으면 새 뜻으로 채운다. */
export function addWord(lib: Library, w: NewWord, now = Date.now()): Library {
  const id = keyOf(w.id);
  if (!id) return lib;
  const existing = lib.words.find((x) => x.id === id);
  if (existing) {
    if (existing.meaning || !w.meaning) return lib;
    return { ...lib, words: lib.words.map((x) => (x.id === id ? { ...x, meaning: w.meaning } : x)) };
  }
  const word: SavedWord = {
    id,
    surface: w.surface,
    meaning: w.meaning,
    sentence: w.sentence,
    bookId: w.bookId,
    from: w.from,
    level: w.level ?? '',
    addedAt: now,
    right: 0,
    wrong: 0,
    lastQuizAt: null,
  };
  return { ...lib, words: [word, ...lib.words] };
}

export function updateWord(lib: Library, id: string, patch: Partial<Pick<SavedWord, 'meaning'>>): Library {
  return { ...lib, words: lib.words.map((w) => (w.id === id ? { ...w, ...patch } : w)) };
}

export function removeWord(lib: Library, id: string): Library {
  return { ...lib, words: lib.words.filter((w) => w.id !== id) };
}

/** 퀴즈 한 문제의 결과 — 횟수만 센다. 다음 복습일은 셈하지 않는다(복습 알고리즘 꺼짐). */
export function recordQuiz(lib: Library, id: string, correct: boolean, now = Date.now()): Library {
  return {
    ...lib,
    words: lib.words.map((w) =>
      w.id === id
        ? { ...w, right: w.right + (correct ? 1 : 0), wrong: w.wrong + (correct ? 0 : 1), lastQuizAt: now }
        : w,
    ),
  };
}

/** 가져오기 — 책은 id가 겹치지 않는 것만 더하고, 낱말은 [addWord] 규칙으로 합친다. */
export function mergeLibrary(lib: Library, incoming: Library): Library {
  const bookIds = new Set(lib.books.map((b) => b.id));
  let next: Library = { ...lib, books: [...lib.books, ...incoming.books.filter((b) => !bookIds.has(b.id))] };
  for (const w of [...incoming.words].reverse()) {
    if (next.words.some((x) => x.id === w.id)) {
      next = addWord(next, w);
    } else {
      next = { ...next, words: [w, ...next.words] };
    }
  }
  return next;
}

export function exportLibrary(lib: Library): string {
  return JSON.stringify({ app: 'MolB World', exportedAt: new Date().toISOString(), ...lib }, null, 2);
}

export function firstLineTitle(text: string): string {
  const line = text.trim().split('\n')[0]?.trim() ?? '';
  if (!line) return '제목 없는 책';
  return line.length > 40 ? `${line.slice(0, 40)}…` : line;
}

/** 이 책에서 담은 낱말들. */
export function wordsOfBook(lib: Library, bookId: string): SavedWord[] {
  return lib.words.filter((w) => w.bookId === bookId);
}

/** 단어장에 보일 모습 — 사전형(소문자)이 기본이고, 문장 가운데서 대문자로 쓴 이름(Molbi · Seoul)만 적힌 그대로. */
export function displayWord(w: Pick<SavedWord, 'id' | 'surface' | 'sentence'>): string {
  const proper = /^[A-Z]/.test(w.surface) && keyOf(w.surface) === w.id && !w.sentence.trimStart().startsWith(w.surface);
  return proper ? w.surface : w.id;
}

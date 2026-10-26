/**
 * 블랭크북의 책 — 학습주제(책) · 주제 카드(쪽: 제목 · 글) · 외울 낱말 · 조사 결정.
 *
 * 앱의 `lib/services/blankbook/blank_book.dart`(dfc4171^)를 옮겼다. OCR 그림 · 상자는 사이트에 없다.
 *
 * **외울 낱말은 글자리가 아니라 낱말로 적는다**(book.terms). 글 안의 자리는 그때그때 글을 어절로 나눠 찾는다([buildIndex]) — 그래서
 * 글을 고쳐도 표시가 엇나가지 않고, 한 낱말을 칠하면 그 낱말이 선 자리가 다 칠해진다. 조사를 어디서 떼는지는 어절마다 적는다
 * (book.splits — 사람이 고쳤거나 따옴표가 정한 것만, 나머지는 [splitParticle]의 짐작).
 */
import { learnStems, splitParticle, type ParticleSplit } from './josa';

export type SplitBy = 'manual' | 'quote';
export type SplitDecision = { n: number; by: SplitBy };
export type TermOrigin = 'user' | 'auto';
export type BlankTerm = { text: string; origin: TermOrigin };

export type BlankPage = {
  id: string;
  /** 주제 카드의 제목 — 퀴즈 글이 아니다(빈칸이 안 선다). */
  title: string;
  text: string;
  folded: boolean;
};

export type BlankBook = {
  id: string;
  title: string;
  pages: BlankPage[];
  terms: BlankTerm[];
  /** 어절 → 조사 결정. 없는 어절은 짐작. */
  splits: Record<string, SplitDecision>;
  /** 예시로 만든 책이면 그 예시의 열쇠 — 같은 예시를 두 번 만들지 않게. */
  sample?: string;
  createdAt: number;
  updatedAt: number;
  studiedAt: number | null;
};

export type BlankToken = { start: number; end: number; text: string };

/** 어절 — 한글 · 로마자 · 숫자가 이어진 덩어리(영어의 ' 와 - 는 낱말 안으로). '·' · 괄호 · 문장부호는 가른다. */
const TOKEN = /[0-9A-Za-zÀ-ɏ가-힣ㄱ-ㆎ]+(?:['’-][0-9A-Za-zÀ-ɏ가-힣]+)*/g;

export function tokenize(text: string): BlankToken[] {
  return [...text.matchAll(TOKEN)].map((m) => ({ start: m.index ?? 0, end: (m.index ?? 0) + m[0].length, text: m[0] }));
}

/** 낱말의 열쇠 — 앞뒤 빈칸을 떼고, 빈칸은 하나로, 로마자는 작게. */
export const termKey = (term: string) => term.trim().replace(/\s+/g, ' ').toLowerCase();

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function newPage(title = '', text = ''): BlankPage {
  return { id: newId('page'), title, text, folded: false };
}

export function newBook(title: string, pages: BlankPage[] = [], now = Date.now()): BlankBook {
  return { id: newId('book'), title: title.trim() || '새 학습주제', pages, terms: [], splits: {}, createdAt: now, updatedAt: now, studiedAt: null };
}

export const hasTerm = (book: BlankBook, key: string) => book.terms.some((t) => termKey(t.text) === key);

/** 카드 · 문제 머리에 설 이름 — 제목, 없으면 '(제목 없음)'. */
export const pageLabel = (page: BlankPage) => page.title.trim() || '(제목 없음)';

/** 낱말을 더하거나(없으면) 뺀다(있으면). */
export function toggleTerm(book: BlankBook, text: string, origin: TermOrigin = 'user'): BlankBook {
  const key = termKey(text);
  if (!key) return book;
  if (hasTerm(book, key)) return { ...book, terms: book.terms.filter((t) => termKey(t.text) !== key) };
  return { ...book, terms: [...book.terms, { text: text.trim(), origin }] };
}

/** 낱말 [from]을 [to]로 — 조사 경계가 바뀌어 낱말이 달라졌을 때. [to]가 이미 있으면 [from]만 뺀다. */
export function renameTerm(book: BlankBook, from: string, to: string): BlankBook {
  const fk = termKey(from);
  const tk = termKey(to);
  if (fk === tk || !tk) return book;
  const had = book.terms.find((t) => termKey(t.text) === fk);
  if (!had) return book;
  const rest = book.terms.filter((t) => termKey(t.text) !== fk);
  if (rest.some((t) => termKey(t.text) === tk)) return { ...book, terms: rest };
  return { ...book, terms: [...rest, { text: to.trim(), origin: had.origin }] };
}

/** 어절의 낱말 · 조사 — 적힌 결정이 먼저(글자 수가 맞을 때만), 없으면 짐작. */
export function splitWith(eojeol: string, splits: Record<string, SplitDecision>, known: ReadonlySet<string>): ParticleSplit {
  const d = splits[eojeol];
  if (d && d.n > 0 && d.n <= eojeol.length) return { stem: eojeol.slice(0, d.n), particle: eojeol.slice(d.n) };
  return splitParticle(eojeol, known);
}

/** 글 안에서 외울 낱말이 선 자리 — 낱말은 [start, end), 뒤의 조사는 [end, tailEnd). */
export type BlankSpot = { page: number; start: number; end: number; tailEnd: number; key: string; eojeol: string };

export type BookIndex = {
  book: BlankBook;
  tokens: BlankToken[][];
  known: Set<string>;
  spots: BlankSpot[];
  split: (eojeol: string) => ParticleSplit;
  spotsOn: (page: number) => BlankSpot[];
  spotsOf: (key: string) => BlankSpot[];
};

/** 책을 한 번 읽어 둔 것 — 쪽마다 어절, 글의 앎, 외울 낱말이 선 자리. 책이 바뀌면 새로 짓는다. */
export function buildIndex(book: BlankBook): BookIndex {
  const tokens = book.pages.map((p) => tokenize(p.text));
  const known = learnStems(tokens.flat().map((t) => t.text));
  const split = (eojeol: string) => splitWith(eojeol, book.splits, known);
  const keys = new Set(book.terms.map((t) => termKey(t.text)));
  const phrases = [...keys].filter((k) => k.includes(' ')).map((k) => k.split(' '));
  const spots: BlankSpot[] = [];
  tokens.forEach((toks, pageIndex) => {
    for (let i = 0; i < toks.length; i++) {
      const tok = toks[i]!;
      // 여러 어절 덩어리 — 앞 어절들은 그대로, 마지막 어절은 조사를 뗀 낱말로 맞춘다.
      let matched = false;
      for (const words of phrases) {
        const n = words.length;
        if (i + n > toks.length) continue;
        let ok = true;
        for (let k = 0; k < n - 1 && ok; k++) ok = termKey(toks[i + k]!.text) === words[k];
        if (!ok) continue;
        const last = toks[i + n - 1]!;
        const s = split(last.text);
        if (termKey(s.stem) !== words[n - 1]) continue;
        spots.push({ page: pageIndex, start: tok.start, end: last.start + s.stem.length, tailEnd: last.end, key: words.join(' '), eojeol: last.text });
        i += n - 1;
        matched = true;
        break;
      }
      if (matched) continue;
      const s = split(tok.text);
      const key = termKey(s.stem);
      if (!keys.has(key)) continue;
      spots.push({ page: pageIndex, start: tok.start, end: tok.start + s.stem.length, tailEnd: tok.end, key, eojeol: tok.text });
    }
  });
  return {
    book,
    tokens,
    known,
    spots,
    split,
    spotsOn: (page) => spots.filter((s) => s.page === page),
    spotsOf: (key) => spots.filter((s) => s.key === key),
  };
}

/** [keys] 가운데 책 어디에도 안 서는 낱말을 뺀다 — 쪽을 지우거나, 글째 지워 낱말이 남지 않았을 때. */
export function dropOrphanTerms(book: BlankBook, keys: Iterable<string>): BlankBook {
  const index = buildIndex(book);
  const orphans = new Set([...keys].filter((k) => index.spotsOf(k).length === 0));
  if (orphans.size === 0) return book;
  return { ...book, terms: book.terms.filter((t) => !orphans.has(termKey(t.text))) };
}

/** 쪽 [index]를 지운다 — 그 쪽에만 서던 낱말도 함께. */
export function removePage(book: BlankBook, index: number): BlankBook {
  const keys = buildIndex(book).spotsOn(index).map((s) => s.key);
  const pages = book.pages.filter((_, i) => i !== index);
  return dropOrphanTerms({ ...book, pages }, keys);
}

/** 쪽 [index]를 [from]에서 [to]로 — 그 쪽에 선 외울 낱말과 그 쪽 어절들의 조사 결정이 따라간다. */
export function movePage(from: BlankBook, index: number, to: BlankBook): [BlankBook, BlankBook] {
  const fromIndex = buildIndex(from);
  const page = from.pages[index];
  if (!page) return [from, to];
  const moved: BlankPage = { ...page, id: newId('page') };
  const splits = { ...to.splits };
  for (const tok of fromIndex.tokens[index] ?? []) {
    const d = from.splits[tok.text];
    if (d && !splits[tok.text]) splits[tok.text] = d;
  }
  let target: BlankBook = { ...to, pages: [...to.pages, moved], splits };
  for (const s of fromIndex.spotsOn(index)) {
    const t = from.terms.find((x) => termKey(x.text) === s.key);
    if (t && !hasTerm(target, s.key)) target = { ...target, terms: [...target.terms, t] };
  }
  return [removePage(from, index), target];
}

/**
 * 조사 결정이 바뀐 뒤 — 낱말의 이름이 달라진 것을 따라간다. 옛 결정으로 낱말이던 어절이 새 결정으로 다른 낱말이 되면, 옛 낱말이 새
 * 결정에서 더는 아무 데도 안 서는 경우에만 이름을 바꾼다.
 */
export function followSplits(before: BlankBook, next: Record<string, SplitDecision>): BlankBook {
  const oldIndex = buildIndex(before);
  let book: BlankBook = { ...before, splits: next };
  const newIndex = buildIndex(book);
  const renames = new Map<string, string>();
  for (const spot of oldIndex.spots) {
    if (spot.key.includes(' ')) continue;
    const now = splitWith(spot.eojeol, next, newIndex.known).stem;
    if (termKey(now) === spot.key || !termKey(now)) continue;
    if (newIndex.spotsOf(spot.key).length > 0) continue;
    renames.set(spot.key, now);
  }
  for (const [key, to] of renames) {
    const from = before.terms.find((t) => termKey(t.text) === key)?.text;
    if (from) book = renameTerm(book, from, to);
  }
  return book;
}

/** 책 표지의 빛 — MolB 종이 빛깔 여섯 가운데 책 id로(같은 책은 늘 같은 빛). CSS 변수 이름을 돌려준다. */
const COVERS = ['--action-tint', '--growth-tint', '--challenge-tint', '--alert-tint', '--trail', '--meadow'];

export function coverVar(bookId: string): string {
  let h = 0;
  for (let i = 0; i < bookId.length; i++) h = (h * 31 + bookId.charCodeAt(i)) & 0x7fffffff;
  return COVERS[h % COVERS.length]!;
}

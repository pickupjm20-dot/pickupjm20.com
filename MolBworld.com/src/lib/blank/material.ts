/**
 * 따옴표 빈칸 자료 — '제목 · 내용'으로 적고 외울 낱말을 큰따옴표로 감싼 글. 앱의 `blank_material.dart`(dfc4171^)를 옮겼다.
 *
 *     제목: 광합성
 *     "광합성"은 식물이 "빛 에너지"를 이용해 "포도당"을 만드는 과정이다.
 *
 *     제목: 세포 호흡
 *     "미토콘드리아"에서 포도당을 분해해 "ATP"를 얻는다.
 *
 *  - 제목: `제목:` · `Title:` 줄 또는 마크다운 머리(`#` ~ `######`). 제목마다 주제 카드 하나, 첫 제목이 학습주제 이름.
 *  - 빈칸: 큰따옴표(`"…"` · `“…”`) 안의 짧은 말(30자 · 네 어절까지). 길거나 문장 같은 따옴표는 인용으로 둔다. 작은따옴표는 안 본다.
 *  - 조사: 따옴표가 끝난 자리가 낱말의 끝 — 그 어절의 조사 경계를 바로 적는다('quote').
 *
 * 필기 카드도 같은 꼴이다 — 카드의 글은 외울 낱말이 선 자리를 따옴표로 감싼 글이고([quotedText]), 고친 글을 그대로 들인다([applyQuotedText]).
 */
import {
  buildIndex,
  hasTerm,
  newBook,
  newPage,
  termKey,
  toggleTerm,
  tokenize,
  type BlankBook,
  type BookIndex,
  type SplitDecision,
} from './book';
import { splitParticle } from './josa';
import { autoPickTerms } from './pick';

/** AI(ChatGPT · Claude · Gemini)에게 줄 부탁 글 — 앱의 kMaterialPrompt 그대로. */
export const MATERIAL_PROMPT = `아래 주제로 빈칸 공부 자료를 만들어 줘. 꼴을 꼭 지켜 줘.
- 소주제마다 첫 줄에 "제목: 소주제 이름"을 적고, 그 아래에 설명하는 글을 문단으로 적어.
- 외워야 할 핵심 용어는 큰따옴표로 감싸 줘. 예: "광합성"은 "엽록체"에서 일어난다.
- 조사(은 · 는 · 이 · 가 · 을 · 를 · 에서 …)는 따옴표 밖에 둬.
- 용어는 한두 낱말로 짧게. 같은 용어는 한 번만 감싸도 돼.
- 표 · 목록 기호 · 굵은 글씨 없이 글로만 적어 줘.

주제: `;

/** 붙여 넣은 글에서 우리 부탁 글을 걷는다 — 부탁 글만이면 빈 글, 대화째 복사했으면 AI의 답만. */
export function withoutMaterialPrompt(raw: string): string {
  const text = raw.replace(/\r\n/g, '\n');
  const body = MATERIAL_PROMPT.slice(0, MATERIAL_PROMPT.lastIndexOf('\n'));
  const at = text.indexOf(body);
  if (at < 0) return raw;
  const rest = text.slice(at + body.length).replace(/^\s*주제\s*[:：][^\n]*/, '');
  return `${text.slice(0, at)}${rest}`.trim();
}

export const TERM_MAX_CHARS = 30;
export const TERM_MAX_WORDS = 4;

export type QuotedSection = { title: string | null; text: string };
export type QuotedMaterial = {
  title: string | null;
  sections: QuotedSection[];
  terms: string[];
  splits: Record<string, SplitDecision>;
};

const HEADING = /^\s*(?:제목\s*[:：]|title\s*:|#{1,6}\s+)\s*(.*)$/i;
const CONTENT_LABEL = /^\s*(?:내용|본문|content)\s*[:：]\s*/i;
const QUOTED = /"([^"\n]+)"|“([^”\n]+)”/g;
const WORD_CHAR = /[0-9A-Za-z가-힣]/;
const EDGE = /^([^0-9A-Za-z가-힣]*)([\s\S]*?)([^0-9A-Za-z가-힣]*)$/;

/** 빈칸이 될 따옴표를 벗긴 글과, 벗긴 말의 자리 [start, end)들. */
function unquote(body: string): [string, [number, number][]] {
  let out = '';
  const marks: [number, number][] = [];
  let at = 0;
  for (const m of body.matchAll(QUOTED)) {
    const inner = (m[1] ?? m[2] ?? '').trim();
    const edge = EDGE.exec(inner)!;
    const term = edge[2] ?? '';
    const words = term.split(/\s+/).length;
    if (!term || term.length > TERM_MAX_CHARS || words > TERM_MAX_WORDS || !WORD_CHAR.test(term)) continue; // 인용 — 그대로
    out += body.slice(at, m.index) + (edge[1] ?? '');
    const start = out.length;
    out += term;
    marks.push([start, out.length]);
    out += edge[3] ?? '';
    at = (m.index ?? 0) + m[0].length;
  }
  out += body.slice(at);
  return [out, marks];
}

/** 낱말 [start, end)가 끝나는 어절의 조사 경계를 적는다 — 낱말이 어절의 앞머리에서 끝날 때만. */
function decide(page: string, start: number, end: number, splits: Record<string, SplitDecision>, override = false) {
  for (const tok of tokenize(page)) {
    if (tok.start >= end || tok.end < end) continue;
    if (tok.start < start && !page.slice(start, end).includes(' ')) return;
    const stem = end - tok.start;
    if (stem <= 0 || stem > tok.text.length) return;
    const had = splits[tok.text];
    if (!had || (override && had.n !== stem)) splits[tok.text] = { n: stem, by: 'quote' };
    return;
  }
}

const cleanHeading = (h: string) => {
  let s = h.replace(/\*\*/g, '').trim();
  if (s.length >= 2 && ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith('“') && s.endsWith('”')))) s = s.slice(1, -1).trim();
  return s;
};

/** 글을 자료로 읽는다 — 제목도 따옴표 낱말도 없으면 null(그냥 글). */
export function parseQuotedMaterial(raw: string): QuotedMaterial | null {
  const text = raw.replace(/\r\n?/g, '\n').replace(/^﻿/, '');
  const sections: { heading: string | null; lines: string[] }[] = [];
  let current: { heading: string | null; lines: string[] } = { heading: null, lines: [] };
  const flush = () => {
    if (current.heading != null || current.lines.some((l) => l.trim())) sections.push(current);
  };
  for (const line of text.split('\n')) {
    const h = HEADING.exec(line);
    if (h && (h[1] ?? '').trim()) {
      flush();
      current = { heading: cleanHeading(h[1]!), lines: [] };
      continue;
    }
    // 굵은 글씨 표를 먼저 벗겨야 '**내용:**' 꼬리표도 떨어진다.
    current.lines.push(line.replace(/\*\*/g, '').replace(CONTENT_LABEL, ''));
  }
  flush();

  const pages: QuotedSection[] = [];
  const terms: string[] = [];
  const seen = new Set<string>();
  const splits: Record<string, SplitDecision> = {};
  let title: string | null = null;
  for (const s of sections) {
    const body = s.lines.join('\n').replace(/\*\*/g, '').trim();
    if (!body) continue;
    title ??= s.heading;
    const [plain, marks] = unquote(body);
    for (const [a, b] of marks) {
      const term = plain.slice(a, b);
      if (!seen.has(termKey(term))) {
        seen.add(termKey(term));
        terms.push(term);
      }
      decide(plain, a, b, splits);
    }
    pages.push({ title: s.heading, text: plain });
  }
  if (pages.length === 0 || (title == null && terms.length === 0)) return null;
  // 따옴표 없이 다시 나온 자리 — 낱말 그대로인 어절은 통째로, 낱말 + 조사면 그 낱말을 앎으로 삼은 짐작이 낱말을 남길 때만.
  const known = new Set(terms.filter((t) => !t.includes(' ')));
  for (const page of pages) {
    for (const tok of tokenize(page.text)) {
      if (splits[tok.text]) continue;
      if (known.has(tok.text)) {
        splits[tok.text] = { n: tok.text.length, by: 'quote' };
        continue;
      }
      const stem = splitParticle(tok.text, known).stem;
      if (stem !== tok.text && known.has(stem)) splits[tok.text] = { n: stem.length, by: 'quote' };
    }
  }
  return { title, sections: pages, terms, splits };
}

/** 자료 → 책. 제목마다 주제 카드, 첫 제목이 이름(없으면 [fallbackTitle]). 여럿이면 접어서 선다. */
export function bookFromMaterial(m: QuotedMaterial, fallbackTitle: string): BlankBook {
  const pages = m.sections.map((s) => ({ ...newPage(s.title ?? '', s.text), folded: m.sections.length > 1 }));
  let book = newBook(m.title ?? fallbackTitle, pages);
  book = { ...book, splits: { ...m.splits } };
  for (const t of m.terms) if (!hasTerm(book, termKey(t))) book = toggleTerm(book, t);
  // 따옴표 낱말이 없고 제목만 있으면 쪽만 나누고 먼저 칠한다.
  if (m.terms.length === 0) book = autoPickTerms(book);
  return book;
}

/** 그냥 글 → 책 — 빈 줄에서 1,600자 안팎으로 나눠 쪽으로, 규칙으로 먼저 칠한다(앱의 파일 가져오기). */
export function bookFromPlainText(text: string, title: string): BlankBook {
  const paras = text.replace(/\r\n?/g, '\n').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let cur = '';
  for (const p of paras) {
    if (cur && cur.length + p.length > 1600) {
      chunks.push(cur);
      cur = '';
    }
    cur = cur ? `${cur}\n\n${p}` : p;
  }
  if (cur) chunks.push(cur);
  const pages = chunks.map((c) => ({ ...newPage('', c), folded: chunks.length > 1 }));
  return autoPickTerms(newBook(title, pages));
}

// ── 필기 카드의 따옴표 ─────────────────────────────────────────────────────

/** 카드 글의 따옴표 — 쪽 글에서 외울 낱말이 선 자리를 "큰따옴표"로 감싼 글. 글에 이미 있던 따옴표(인용) 안의 자리는 안 감싼다. */
export function quotedText(index: BookIndex, page: number): string {
  const text = index.book.pages[page]?.text ?? '';
  const cited = [...text.matchAll(QUOTED)].map((m) => [m.index ?? 0, (m.index ?? 0) + m[0].length] as const);
  let out = '';
  let at = 0;
  for (const s of index.spotsOn(page)) {
    if (cited.some(([a, b]) => s.start < b && s.end > a)) continue;
    out += `${text.slice(at, s.start)}"${text.slice(s.start, s.end)}"`;
    at = s.end;
  }
  return out + text.slice(at);
}

/**
 * 카드에서 고친 글([raw] — 따옴표째)을 쪽 [page]에 들인다. 따옴표를 벗긴 글이 쪽 글, 따옴표 안의 말은 외울 낱말(없으면 더함), 따옴표가
 * 끝난 자리가 조사 경계. 따옴표를 벗겼는데 그 말이 이 쪽에 그대로 있으면 외울 낱말에서 뺀다(책 전체에서). 말째 지웠으면 책 어디에도 안
 * 설 때만 뺀다. 어절 가운데서 연 따옴표(낱말로 안 서는 말)는 안 남긴다.
 */
export function applyQuotedText(book: BlankBook, page: number, raw: string): BlankBook {
  const had = new Set(buildIndex(book).spotsOn(page).map((s) => s.key));
  const [plain, marks] = unquote(raw.replace(/\r\n/g, '\n'));
  const splits = { ...book.splits };
  const quoted = new Map<string, string>();
  for (const [a, b] of marks) {
    const term = plain.slice(a, b);
    if (!quoted.has(termKey(term))) quoted.set(termKey(term), term);
    decide(plain, a, b, splits, true);
  }
  const pages = book.pages.map((p, i) => (i === page ? { ...p, text: plain } : p));
  let next: BlankBook = { ...book, pages, splits };
  for (const [key, term] of quoted) if (!hasTerm(next, key)) next = toggleTerm(next, term);
  const index = buildIndex(next);
  const drop = new Set<string>();
  for (const key of had) {
    if (!quoted.has(key) && (index.spotsOn(page).some((s) => s.key === key) || index.spotsOf(key).length === 0)) drop.add(key);
  }
  for (const key of quoted.keys()) if (!hasTerm(book, key) && index.spotsOf(key).length === 0) drop.add(key);
  if (drop.size === 0) return next;
  return { ...next, terms: next.terms.filter((t) => !drop.has(termKey(t.text))) };
}

/** 글 [raw]에서 따옴표로 감싼 외울 말들 — 카드 아래 칩(치는 동안에도 바로). 겹치면 하나. */
export function quotedTerms(raw: string): string[] {
  const [plain, marks] = unquote(raw);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const [a, b] of marks) {
    const t = plain.slice(a, b);
    if (seen.has(termKey(t))) continue;
    seen.add(termKey(t));
    out.push(t);
  }
  return out;
}

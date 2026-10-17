/**
 * 글을 리더가 그릴 모양으로 쪼갠다 — 문단 → 문장 → 낱말.
 *
 * 규칙은 앱과 같다(`lib/services/sentence_splitter.dart` · `passage_layout.dart` · `SentenceReading.keyOf`).
 * 찍먹 지문과 블랭크북이 같은 쪼개기를 쓰므로, 같은 글이면 같은 자리에서 끊긴다.
 */

export type Token = {
  text: string;
  /** 누를 수 있는 낱말인가(띄어쓰기 · 문장부호는 아니다). */
  word: boolean;
  /** 맞춰 볼 열쇠 — [keyOf]. 낱말이 아니면 ''. */
  key: string;
};

export type Sentence = {
  /** 글 전체에서 몇 번째 문장인가 — 미리 적은 풀이(`[n]`)와 같은 자리를 가리킨다. */
  index: number;
  text: string;
  tokens: Token[];
};

export type Paragraph = { sentences: Sentence[] };

export type Doc = { paragraphs: Paragraph[]; sentenceCount: number; wordCount: number };

const WORD = /[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g;

/**
 * 낱말 열쇠 — 누른 낱말과 적힌 낱말을 같은 모습으로 맞춘다: 소문자, ’ → ', 글자 · 숫자 · ' · - 말고는 빼고,
 * 앞뒤의 ' · -도 뺀다. 덩어리(숙어)는 낱말마다 그렇게 해 빈칸 하나로 잇는다.
 */
export function keyOf(s: string): string {
  return s
    .replace(/’/g, "'")
    .toLowerCase()
    .split(/\s+/)
    .map((p) => p.replace(/[^a-z0-9'-]/g, '').replace(/^[-']+|[-']+$/g, ''))
    .filter((p) => p.length > 0)
    .join(' ');
}

export function tokenize(sentence: string): Token[] {
  const out: Token[] = [];
  let last = 0;
  for (const m of sentence.matchAll(WORD)) {
    const at = m.index ?? 0;
    if (at > last) out.push({ text: sentence.slice(last, at), word: false, key: '' });
    out.push({ text: m[0], word: true, key: keyOf(m[0]) });
    last = at + m[0].length;
  }
  if (last < sentence.length) out.push({ text: sentence.slice(last), word: false, key: '' });
  return out;
}

/**
 * 문단 하나를 문장으로 — 마침표 · 물음표 · 느낌표(닫는 따옴표 · 괄호까지) 뒤의 빈칸에서 끊는다.
 * `Mr. Kim`처럼 짧은 줄임말 뒤, 소문자로 이어지는 자리에서는 안 끊는다.
 */
export function splitSentences(paragraph: string): string[] {
  const text = paragraph.trim();
  if (!text) return [];
  const out: string[] = [];
  const re = /[.?!]+["'”’)\]]*\s+/g;
  let start = 0;
  for (const m of text.matchAll(re)) {
    const end = (m.index ?? 0) + m[0].length;
    const before = text.slice(start, m.index ?? 0);
    if (/\b(Mr|Mrs|Ms|Dr|St|vs|etc|e\.g|i\.e|No)$/i.test(before)) continue;
    // 다음 글자가 소문자면 문장이 이어진다 — “Really?” she asked.
    if (/[a-z]/.test(text.charAt(end))) continue;
    out.push(text.slice(start, end).trim());
    start = end;
  }
  if (start < text.length) out.push(text.slice(start).trim());
  return out.filter((s) => s.length > 0);
}

/**
 * 글을 문단으로 — 빈 줄이 있으면 빈 줄이 문단을 가르고(문단 안의 줄바꿈은 빈칸으로 잇는다),
 * 빈 줄이 하나도 없으면 줄바꿈이 곧 문단이다(앱의 `passage_layout.dart`와 같은 규칙).
 */
export function splitParagraphs(text: string): string[] {
  const clean = text.replace(/\r\n?/g, '\n').trim();
  if (!clean) return [];
  if (/\n\s*\n/.test(clean)) {
    return clean
      .split(/\n\s*\n/)
      .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
      .filter(Boolean);
  }
  return clean
    .split('\n')
    .map((p) => p.trim())
    .filter(Boolean);
}

export function buildDoc(text: string): Doc {
  let index = 0;
  let wordCount = 0;
  const paragraphs = splitParagraphs(text).map((p) => ({
    sentences: splitSentences(p).map((s) => {
      const tokens = tokenize(s);
      wordCount += tokens.filter((t) => t.word).length;
      return { index: index++, text: s, tokens };
    }),
  }));
  return { paragraphs, sentenceCount: index, wordCount };
}

/** 문장 안에서 [tokenIndex]번째 낱말을 ** **로 감싼 모습 — 카드에서 그 낱말만 굵게 보이려고. */
export function markInSentence(sentence: Sentence, tokenIndex: number): { before: string; word: string; after: string } {
  const before = sentence.tokens.slice(0, tokenIndex).map((t) => t.text).join('');
  const word = sentence.tokens[tokenIndex]?.text ?? '';
  const after = sentence.tokens.slice(tokenIndex + 1).map((t) => t.text).join('');
  return { before, word, after };
}

/** 낱말 수만 — 책장처럼 글을 다 쪼갤 필요가 없는 자리. */
export function countWords(text: string): number {
  return text.match(WORD)?.length ?? 0;
}

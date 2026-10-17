/**
 * 앱의 읽을거리 글 파일을 읽는다 — `IMG:` 머리줄, 본문, `=== 문장 해석 ===` 아래 문장마다의 해석과 낱말 풀이.
 *
 *     IMG: warm_bowl.webp | 오늘은 따뜻한 한 그릇
 *
 *     Do you want a warm lunch? ...
 *
 *     === 문장 해석 ===
 *
 *     [1] Do you want a warm lunch?
 *     따뜻한 점심이 먹고 싶니?
 *     - want: 원하다, ~하고 싶다
 *     - vegetables (vegetable): 채소
 *     - less than: ~보다 적은          ← 빈칸이 든 열쇠는 덩어리(숙어)
 *
 * 앱의 `PassageGloss` · `SentenceReading`과 같은 규칙으로 맞춘다: 적힌 모습이 같은 줄이 먼저, 다음은 괄호의
 * 사전형, 그다음은 흔한 활용 꼬리. AI를 부르지 않는다 — 풀이가 글 파일에 미리 적혀 있다.
 */
import { keyOf, type Sentence } from './text';

export type GlossWord = {
  /** 문장에 적힌 모습(`vegetables`). */
  word: string;
  /** 단어장에 담길 사전형(`vegetable`). 괄호가 없으면 [word]와 같다. */
  lemma: string;
  meaning: string;
  /** 빈칸이 든 열쇠 — 숙어 · 구동사. */
  phrase: boolean;
};

export type SentenceReading = { english: string; korean: string; words: GlossWord[] };

export type ParsedPassage = {
  image: string;
  title: string;
  body: string;
  readings: SentenceReading[];
};

const SPLIT = '=== 문장 해석 ===';

export function parsePassageFile(raw: string): ParsedPassage {
  const text = raw.replace(/\r\n?/g, '\n');
  const cut = text.indexOf(SPLIT);
  const head = cut >= 0 ? text.slice(0, cut) : text;
  const tail = cut >= 0 ? text.slice(cut + SPLIT.length) : '';

  const lines = head.split('\n');
  let image = '';
  let title = '';
  if (lines[0]?.startsWith('IMG:')) {
    const [file, name] = lines[0].slice(4).split('|');
    image = (file ?? '').trim();
    title = (name ?? '').trim();
    lines.shift();
  }
  const body = lines.join('\n').trim();

  const readings: SentenceReading[] = [];
  let current: SentenceReading | null = null;
  for (const line of tail.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    const numbered = /^\[(\d+)\]\s*(.*)$/.exec(t);
    if (numbered) {
      current = { english: numbered[2] ?? '', korean: '', words: [] };
      readings.push(current);
      continue;
    }
    if (!current) continue;
    if (t.startsWith('- ')) {
      const entry = parseWordLine(t.slice(2));
      if (entry) current.words.push(entry);
    } else if (!current.korean) {
      current.korean = t;
    }
  }
  return { image, title, body, readings };
}

/** `gathers (gather): 모으다` → 낱말 · 사전형 · 뜻. 뜻에도 ':'가 들 수 있으니 첫 ':'에서만 자른다. */
export function parseWordLine(line: string): GlossWord | null {
  const colon = line.indexOf(':');
  if (colon <= 0) return null;
  const key = line.slice(0, colon).trim();
  const meaning = line.slice(colon + 1).trim();
  if (!key || !meaning) return null;
  const withBase = /^(.+?)\s*\(([^)]+)\)$/.exec(key);
  const word = (withBase ? withBase[1] : key)?.trim() ?? key;
  const lemma = (withBase ? withBase[2] : word)?.trim() ?? word;
  return { word, lemma, meaning, phrase: keyOf(word).includes(' ') };
}

/** 본문의 문장에 맞는 해석 — 글자를 맞춰 찾고, 못 찾으면 같은 번호의 것. */
export function readingsByText(readings: SentenceReading[]): Map<string, SentenceReading> {
  const map = new Map<string, SentenceReading>();
  for (const r of readings) map.set(keyOf(r.english), r);
  return map;
}

export function readingFor(
  byText: Map<string, SentenceReading>,
  readings: SentenceReading[],
  sentence: Sentence,
): SentenceReading | undefined {
  return byText.get(keyOf(sentence.text)) ?? readings[sentence.index];
}

/**
 * [surface]가 사전형 [base]의 흔한 활용인가 — -s · -es · -ed · -d · -ing, y→ies · ied, e를 떼고 -ing, 받침 겹쳐
 * -ed · -ing, ie→ying, 소유격 's. [base]가 세 글자 이상일 때만(짧은 말은 엉뚱한 낱말에 걸린다).
 */
export function inflects(base: string, surface: string): boolean {
  if (base === surface) return true;
  if (base.length < 3 || surface.length <= base.length - 2) return false;
  for (const tail of ['s', 'es', 'ed', 'd', 'ing', "'s", "s'"]) {
    if (surface === base + tail) return true;
  }
  const stem = base.slice(0, -1);
  const last = base.slice(-1);
  if (last === 'y' && (surface === `${stem}ies` || surface === `${stem}ied`)) return true;
  if (last === 'e' && surface === `${stem}ing`) return true;
  if (base.endsWith('ie') && surface === `${base.slice(0, -2)}ying`) return true;
  if (/[bdgklmnprt]$/.test(base) && (surface === `${base}${last}ed` || surface === `${base}${last}ing`)) return true;
  return false;
}

/** 이 문장에 적힌 [surface]의 풀이 한 줄 — 덩어리 줄은 안 준다([phraseAt]). */
export function entryFor(reading: SentenceReading | undefined, surface: string): GlossWord | undefined {
  if (!reading) return undefined;
  const s = keyOf(surface);
  if (!s || s.includes(' ')) return undefined;
  const words = reading.words.filter((w) => !w.phrase);
  return (
    words.find((w) => keyOf(w.word) === s) ??
    words.find((w) => keyOf(w.lemma) === s) ??
    words.find((w) => inflects(keyOf(w.word), s))
  );
}

/** 누른 자리를 덮는 숙어 줄 — 숙어의 낱말들이 문장에 잇달아 있고, 그 사이에 누른 낱말이 들어 있을 때. */
export function phraseAt(
  reading: SentenceReading | undefined,
  sentence: Sentence,
  tokenIndex: number,
): GlossWord | undefined {
  if (!reading) return undefined;
  const words = sentence.tokens.map((t, i) => ({ key: t.key, i })).filter((w) => w.key);
  const at = words.findIndex((w) => w.i === tokenIndex);
  if (at < 0) return undefined;
  for (const p of reading.words) {
    if (!p.phrase) continue;
    const parts = keyOf(p.word).split(' ');
    for (let start = Math.max(0, at - parts.length + 1); start <= at; start++) {
      const slice = words.slice(start, start + parts.length);
      if (slice.length === parts.length && slice.every((w, k) => w.key === parts[k] || inflects(parts[k] ?? '', w.key))) {
        return p;
      }
    }
  }
  return undefined;
}

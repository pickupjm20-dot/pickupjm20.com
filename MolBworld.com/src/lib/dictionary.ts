/**
 * 블랭크북의 내장 사전 — 앱에 실린 `en_ko_dictionary.json`(약 5천 낱말)과 `word_levels.json`(CEFR A1~C1)을
 * `[낱말, 뜻, 품사, 발음, 등급]` 배열 하나로 눌러 담은 것(`scripts/import_assets.py`).
 *
 * 사이트는 AI를 부르지 않는다 — 키가 없고, 블랭크북은 브라우저 안에서 끝나는 기능이다. 사전에 없는 낱말이나 문맥에서
 * 뜻이 다른 낱말은 사용자가 뜻을 적는다(그래서 '블랭크'북이다).
 */
import { candidates } from './lemma';
import { keyOf } from './text';

export type DictEntry = { word: string; ko: string; pos: string; ipa: string; level: string };
export type Dictionary = ReadonlyMap<string, DictEntry>;
export type LookupResult = { lemma: string; entry: DictEntry | null };

type Row = [string, string, string, string, string];

let pending: Promise<Dictionary> | null = null;

export function buildDictionary(rows: Row[]): Dictionary {
  const map = new Map<string, DictEntry>();
  for (const [word, ko, pos, ipa, level] of rows) {
    const k = keyOf(word);
    if (!k || map.has(k)) continue;
    map.set(k, { word, ko, pos, ipa, level });
  }
  return map;
}

/** 처음 부를 때 한 번 받는다(약 260KB, gzip 70KB). 실패하면 다음에 다시 시도한다. */
export function loadDictionary(): Promise<Dictionary> {
  if (!pending) {
    pending = fetch(`${import.meta.env.BASE_URL}dict/en_ko.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`dictionary ${r.status}`);
        return r.json() as Promise<Row[]>;
      })
      .then(buildDictionary)
      .catch((e: unknown) => {
        pending = null;
        throw e;
      });
  }
  return pending;
}

/**
 * 누른 낱말의 사전형과 풀이 — 후보([candidates])를 차례로 맞춰 처음 걸리는 것. 뜻이 빈 줄(등급만 아는 낱말)은
 * 뜻 있는 후보가 뒤에 있으면 그쪽을 먼저 준다.
 */
export function lookup(dict: Dictionary, surface: string): LookupResult {
  const cands = candidates(surface);
  let levelOnly: LookupResult | null = null;
  for (const c of cands) {
    const e = dict.get(c);
    if (!e) continue;
    if (e.ko) return { lemma: c, entry: e };
    levelOnly ??= { lemma: c, entry: e };
  }
  return levelOnly ?? { lemma: cands[0] ?? keyOf(surface), entry: null };
}

const POS_KO: Record<string, string> = {
  noun: '명사',
  verb: '동사',
  adjective: '형용사',
  adverb: '부사',
  preposition: '전치사',
  conjunction: '접속사',
  pronoun: '대명사',
  determiner: '한정사',
  interjection: '감탄사',
  'indefinite article': '관사',
  'definite article': '관사',
  article: '관사',
  number: '수사',
  'modal verb': '조동사',
  'auxiliary verb': '조동사',
};

export function posLabel(pos: string): string {
  return POS_KO[pos.toLowerCase()] ?? pos;
}

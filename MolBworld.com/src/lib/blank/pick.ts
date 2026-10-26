/**
 * 외울 낱말을 먼저 칠한다 — 파일 · 그냥 글에서 만든 책을 규칙으로 고르고, 사람이 눌러 빼고 더한다(AI 없음).
 * 앱의 `blank_pick.dart`(dfc4171^)를 옮겼다. 시험에 나올 낱말의 버릇을 센다:
 *  - 되풀이되는 용어(두 글자 넘는 낱말, 조사를 뗀 꼴로 셈) · 괄호와 짝('광합성(photosynthesis)')
 *  - 정의의 머리('~란', '~(이)라고 한다') · 우리말 글 속의 로마자 용어(ATP · DNA)
 * 흔한 말(그리고 · 경우 · 때문 …)과 풀이말 끝(하다 · 된다 · 있다 …)은 뺀다.
 */
import { buildIndex, hasTerm, splitWith, termKey, toggleTerm, tokenize, type BlankBook, type SplitDecision } from './book';
import { learnStems } from './josa';

const KOREAN_COMMON = new Set(
  (
    '그리고 그러나 하지만 그런데 그래서 따라서 그러므로 또한 또는 및 등 즉 예를 예컨대 만약 만일 때문 경우 다음 이것 그것 저것 이러한 그러한 ' +
    '이런 그런 어떤 모든 각각 여러 많은 대부분 우리 자신 사람 사람들 정도 부분 하나 두 세 가장 매우 아주 더욱 다시 함께 서로 통해 위해 대해 ' +
    '대한 관한 관해 의해 인해 같은 같이 다른 이후 이전 현재 지금 오늘 처음 마지막 이상 이하 사이 안 밖 위 아래 앞 뒤 중 것 수 때 곳 점 데 바 ' +
    '줄 뿐 이다 있다 없다 한다 된다 했다 되었다 하였다 있는 없는 하는 되는 이는 이를 이에 그는 그를 그의'
  ).split(' '),
);

const PREDICATE_ENDINGS = (
  '하다 한다 했다 하는 하고 하여 해서 하며 하면 하게 되다 된다 됐다 되는 되고 되어 돼서 있다 있는 있고 없다 없는 이다 였다 이었 니다 습니다 ' +
  '세요 시오 면서 지만 는데 므로 어서 아서 으며 거나 든지 도록 듯이 진다 졌다 지는'
).split(' ');

const ENGLISH_COMMON = new Set(
  (
    'the and for with from that this these those into onto over under about there their which while where when what have has had been ' +
    'being were will would should could also than then such each other some many more most very only both between because through page ' +
    'figure table chapter example'
  ).split(' '),
);

/** 풀이말인가 — 끝말 목록, 그리고 받침 ㄴ · ㅆ 뒤의 '다'(일어난다 · 얻었다). '바다' · '보다'는 남는다. */
function isPredicate(stem: string): boolean {
  if (PREDICATE_ENDINGS.some((e) => stem.endsWith(e))) return true;
  const chars = [...stem];
  if (chars.length >= 2 && chars[chars.length - 1] === '다') {
    const prev = chars[chars.length - 2]!.codePointAt(0) ?? 0;
    if (prev >= 0xac00 && prev <= 0xd7a3) {
      const t = (prev - 0xac00) % 28;
      if (t === 4 || t === 20) return true;
    }
  }
  return false;
}

const isHangulWord = (s: string) => /^[가-힣]+$/.test(s);

export type PickedTerm = { text: string; score: number };

/** [text]에서 외울 낱말을 고른다 — 점수 높은 것부터 많아야 [max]개(주지 않으면 서로 다른 후보의 4분의 1, 3~30). */
export function pickKeyTerms(text: string, max?: number, splits: Record<string, SplitDecision> = {}): PickedTerm[] {
  const tokens = tokenize(text);
  if (tokens.length === 0) return [];
  const known = learnStems(tokens.map((t) => t.text));
  const hasHangul = /[가-힣]/.test(text);
  const count = new Map<string, number>();
  const display = new Map<string, string>();
  const bonus = new Map<string, number>();
  const add = (term: string, extra = 0) => {
    const key = termKey(term);
    if (!key) return;
    count.set(key, (count.get(key) ?? 0) + 1);
    if (!display.has(key)) display.set(key, term);
    if (extra > 0) bonus.set(key, (bonus.get(key) ?? 0) + extra);
  };

  tokens.forEach((tok, i) => {
    const s = splitWith(tok.text, splits, known);
    const stem = s.stem;
    const after = text.slice(tok.end, Math.min(text.length, tok.end + 14));
    const latin = /^[A-Za-z][A-Za-z0-9-]*$/.test(stem);
    if (isHangulWord(stem)) {
      if ([...stem].length < 2 || KOREAN_COMMON.has(stem) || isPredicate(stem)) return;
      let extra = 0;
      if (after.startsWith('(') || after.startsWith(' (')) extra += 1.6;
      if (['이란', '란', '이라고', '라고'].includes(s.particle)) extra += 1.4;
      if (
        (s.particle === '은' || s.particle === '는') &&
        /^[^.\n]{0,60}(이?라고|이?라|을|를)\s?(한다|부른다|말한다|정의)/.test(text.slice(tok.end))
      ) {
        extra += 1.0;
      }
      if ([...stem].length >= 3) extra += 0.3;
      add(stem, extra);
    } else if (latin) {
      const acronym = /^[A-Z]{2,6}[0-9]?$/.test(stem);
      if (!acronym && (stem.length < 4 || ENGLISH_COMMON.has(stem.toLowerCase()))) return;
      let extra = hasHangul ? 1.2 : 0;
      if (acronym) extra += 0.8;
      if (tok.start > 0 && text[tok.start - 1] === '(') extra += 0.8;
      if (!hasHangul && /^[A-Z]/.test(stem) && i > 0 && !text.slice(Math.max(0, tok.start - 2), tok.start).includes('.')) extra += 0.5;
      add(stem, extra);
    }
  });
  if (count.size === 0) return [];
  const scored = [...count.entries()]
    .map(([key, n]) => ({ text: display.get(key)!, score: (n >= 2 ? 1 + Math.log(n) : 0.2) + (bonus.get(key) ?? 0) }))
    .sort((a, b) => b.score - a.score);
  const limit = max ?? Math.min(30, Math.max(3, Math.round(count.size / 4)));
  return scored.filter((t) => t.score >= 0.9).slice(0, limit);
}

/** 책 전체에 먼저 칠한다 — 쪽마다 고른 것을 모아(겹치면 하나) 책의 외울 낱말로('auto'). */
export function autoPickTerms(book: BlankBook, perPage = 12): BlankBook {
  let next = book;
  for (const page of book.pages) {
    for (const t of pickKeyTerms(page.text, perPage, book.splits)) {
      if (!hasTerm(next, termKey(t.text))) next = toggleTerm(next, t.text, 'auto');
    }
  }
  return next;
}

/** 이미 있는 낱말은 두고 새로 고른 것만 더한다 — '자동으로 고르기' 단추. 몇 개를 더했는지도 돌려준다. */
export function autoPickMore(book: BlankBook): { book: BlankBook; added: number } {
  const before = book.terms.length;
  const next = autoPickTerms(book);
  // 고른 낱말이 글에 실제로 서는지 한 번 더 — 짐작과 결정이 엇갈린 낱말은 뺀다.
  const index = buildIndex(next);
  const kept = { ...next, terms: next.terms.filter((t) => t.origin !== 'auto' || index.spotsOf(termKey(t.text)).length > 0) };
  return { book: kept, added: kept.terms.length - before };
}

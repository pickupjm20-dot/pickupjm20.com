/**
 * 우리말 조사 — 블랭크북의 빈칸은 **낱말 자리만** 덮고 뒤의 조사는 남긴다('광합성은' → 빈칸 + '은').
 *
 * 앱의 `lib/utils/josa.dart`(블랭크북 때의 판, dfc4171^)를 옮겼다. 사이트는 AI 확인이 없어 이 짐작이 첫 답이고, 틀리면 칠하기에서
 * 꾹 눌러 고친다(사람이 고친 것이 짐작보다 앞선다).
 *
 * 짐작의 규칙:
 *  1. **받침이 짝과 맞아야 조사다** — '국가'의 '가'는 '국'(받침) 뒤라 '이'여야 하므로 조사가 아니다. '으로/로'는 ㄹ 받침 뒤가 '로'.
 *  2. **긴 조사부터** 맞춘다(에서는 · 으로부터 · 이라는 …).
 *  3. **짧은 끝(의 · 에 · 도 · 만 · 이 · 가 …)은 남는 낱말이 두 글자 이상일 때만** — '정의' · '속도' · '길이'를 안 자른다. ㄹ 받침 뒤의
 *     '로'는 예외(물로).
 *  4. **같은 글에서 확실히 뗀 낱말을 따른다**([learnStems]) — '가속도는'을 봤으면 홀로 선 '가속도'를 안 자른다.
 */

/** 마지막 글자의 받침 번호(0 = 없음, 8 = ㄹ) — 한글 음절이 아니거나 비었으면 null. */
export function tail(word: string): number | null {
  const t = word.trim();
  if (!t) return null;
  const code = t.codePointAt(t.length - 1) ?? 0;
  if (code < 0xac00 || code > 0xd7a3) return null;
  return (code - 0xac00) % 28;
}

export const endsWithHangul = (word: string) => tail(word) != null;

/** 받침에 따라 갈리는 짝 조사 — [받침 있을 때, 없을 때]. '으로' 꼴은 ㄹ 받침 뒤에서 '로'다. */
export const PAIRED: readonly (readonly [string, string])[] = [
  ['으로부터', '로부터'], ['으로서는', '로서는'], ['으로써', '로써'], ['으로서', '로서'], ['으로는', '로는'], ['으로도', '로도'],
  ['으로의', '로의'], ['으로', '로'],
  ['이라는', '라는'], ['이라고', '라고'], ['이라도', '라도'], ['이라면', '라면'], ['이란', '란'],
  ['이었다', '였다'], ['이에요', '예요'], ['이지만', '지만'], ['이므로', '므로'], ['이면', '면'],
  ['이나', '나'], ['이며', '며'], ['이랑', '랑'], ['이든', '든'], ['이고', '고'], ['이다', '다'], ['이야', '야'],
  ['과는', '와는'], ['과의', '와의'], ['과도', '와도'], ['과', '와'],
  ['은', '는'], ['이', '가'], ['을', '를'],
];

/** 받침을 안 가리는 조사. */
export const PLAIN: readonly string[] = [
  '에서부터', '에게서는', '에서는', '에서도', '에서의', '에게는', '에게도', '에게서', '까지는', '까지도', '부터는', '부터도',
  '보다는', '에서', '에게', '에는', '에도', '에의', '까지', '부터', '처럼', '보다', '마다', '조차', '마저', '밖에', '만큼',
  '께서', '한테', '대로', '의', '에', '도', '만', '께',
];

/** 낱말 안에 흔히 들어 있는 짧은 끝 — 남는 낱말이 두 글자 이상일 때만 조사로 친다(규칙 3). */
const WEAK = new Set(['이', '가', '과', '와', '의', '에', '도', '만', '께', '다', '고', '나', '며', '야', '든', '면', '로', '란', '랑']);

export type ParticleSplit = { stem: string; particle: string };

const CANDIDATES: { form: string; pair: readonly [string, string] | null }[] = [
  ...PAIRED.flatMap((p) => [
    { form: p[0], pair: p },
    { form: p[1], pair: p },
  ]),
  ...PLAIN.map((form) => ({ form, pair: null })),
].sort((a, b) => b.form.length - a.form.length);

const charLength = (s: string) => [...s].length;

/** [form]이 [stem] 뒤에 붙는 짝 조사의 맞는 꼴인가 — 한글이 아니면(영어 · 숫자) 읽는 법을 몰라 둘 다 맞다. */
function pairAgrees(stem: string, pair: readonly [string, string], form: string): boolean {
  const t = tail(stem);
  if (t == null) return true;
  const rieulVowel = pair[1].startsWith('로');
  const batchim = t !== 0 && !(rieulVowel && t === 8);
  return form === (batchim ? pair[0] : pair[1]);
}

/** 어절의 첫 짐작 — 조사를 뗀다(없으면 particle이 빈 글). [known]은 같은 글에서 확실히 뗀 낱말들. */
export function splitParticle(eojeol: string, known: ReadonlySet<string> = new Set()): ParticleSplit {
  const word = eojeol.trim();
  if (!word || !endsWithHangul(word)) return { stem: word, particle: '' };
  if (known.has(word)) return { stem: word, particle: '' };
  for (const { form, pair } of CANDIDATES) {
    if (!word.endsWith(form) || word.length <= form.length) continue;
    const stem = word.slice(0, word.length - form.length);
    if (pair && !pairAgrees(stem, pair, form)) continue;
    if (known.has(stem)) return { stem, particle: form };
    const rieulRo = form === '로' && tail(stem) === 8;
    if (WEAK.has(form) && !rieulRo && charLength(stem) < 2) continue;
    return { stem, particle: form };
  }
  return { stem: word, particle: '' };
}

/** 글의 어절들에서 확실히 뗀 낱말 — 두 글자 넘는 조사나 은/는 · 을/를로 뗀 것. */
export function learnStems(eojeols: Iterable<string>): Set<string> {
  const out = new Set<string>();
  for (const w of eojeols) {
    const s = splitParticle(w);
    if (!s.particle) continue;
    if (s.particle.length >= 2 || ['은', '는', '을', '를'].includes(s.particle)) out.add(s.stem);
  }
  return out;
}

export function particlePair(particle: string): readonly [string, string] | null {
  return PAIRED.find((p) => p[0] === particle || p[1] === particle) ?? null;
}

/**
 * 빈칸 뒤에 서는 조사 — 짝 조사면 두 꼴을 함께('은(는)' · '(으)로' · '(이)라는' · '과(와)는'), 아니면 그대로.
 * 답을 모를 때 받침이 답을 알려 주지 않게 한다.
 */
export function neutralParticle(particle: string): string {
  const pair = particlePair(particle);
  if (!pair) return particle;
  const [b, n] = pair;
  let common = 0;
  while (common < b.length && common < n.length && b[b.length - 1 - common] === n[n.length - 1 - common]) common++;
  const suffix = b.slice(b.length - common);
  const pb = b.slice(0, b.length - common);
  const pn = n.slice(0, n.length - common);
  return pn ? `${pb}(${pn})${suffix}` : `(${pb})${suffix}`;
}

/** [answer] 뒤에 맞는 꼴 — 짝이 아니거나 답이 한글로 안 끝나면 글에 적힌 그대로. */
export function particleFor(answer: string, particle: string): string {
  const pair = particlePair(particle);
  if (!pair) return particle;
  const t = tail(answer);
  if (t == null) return particle;
  const rieulVowel = pair[1].startsWith('로');
  const batchim = t !== 0 && !(rieulVowel && t === 8);
  return batchim ? pair[0] : pair[1];
}

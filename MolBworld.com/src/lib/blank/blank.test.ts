import { describe, expect, it } from 'vitest';
import { buildIndex, followSplits, movePage, newBook, newPage, removePage, termKey, toggleTerm, type BlankBook } from './book';
import { learnStems, neutralParticle, particleFor, splitParticle } from './josa';
import { applyQuotedText, bookFromMaterial, MATERIAL_PROMPT, parseQuotedMaterial, quotedTerms, quotedText, withoutMaterialPrompt } from './material';
import { pickKeyTerms } from './pick';
import { charDiff, contextRange, isCorrectAnswer, maskedIn, pickQuestion, quizPageIds, quizRange } from './quiz';
import { SAMPLES, sampleBook } from './samples';
import { EMPTY_STORE, mergeStore, recordAnswer, sanitizeStore, upsertBook } from './store';
import { keystrokes, nextRankAfter, rankFor, typingStats, type TypingRound } from './typing';

const seq = (...xs: number[]) => {
  let i = 0;
  return () => xs[i++ % xs.length]!;
};

describe('조사', () => {
  it('받침이 짝과 맞아야 조사다', () => {
    expect(splitParticle('광합성은')).toEqual({ stem: '광합성', particle: '은' });
    expect(splitParticle('엽록체는')).toEqual({ stem: '엽록체', particle: '는' });
    expect(splitParticle('국가')).toEqual({ stem: '국가', particle: '' });
    expect(splitParticle('마을')).toEqual({ stem: '마을', particle: '' });
  });
  it('긴 조사부터, 짧은 끝은 남는 낱말이 두 글자 이상일 때만', () => {
    expect(splitParticle('미토콘드리아에서')).toEqual({ stem: '미토콘드리아', particle: '에서' });
    expect(splitParticle('정의').particle).toBe('');
    expect(splitParticle('속도').particle).toBe('');
    expect(splitParticle('물로')).toEqual({ stem: '물', particle: '로' });
    expect(splitParticle('회로').particle).toBe('');
  });
  it('같은 글에서 뗀 낱말을 따른다', () => {
    const known = learnStems(['가속도는', '가속도를']);
    expect(known.has('가속도')).toBe(true);
    expect(splitParticle('가속도', known).particle).toBe('');
  });
  it('로마자 뒤 조사는 가리지 않는다', () => {
    expect(splitParticle('ATP를')).toEqual({ stem: 'ATP', particle: '를' });
  });
  it('빈칸 뒤의 두 꼴 · 받침에 맞춘 꼴', () => {
    expect(neutralParticle('은')).toBe('은(는)');
    expect(neutralParticle('으로')).toBe('(으)로');
    expect(neutralParticle('이라는')).toBe('(이)라는');
    expect(neutralParticle('과는')).toBe('과(와)는');
    expect(neutralParticle('에서')).toBe('에서');
    expect(particleFor('엽록체', '은')).toBe('는');
    expect(particleFor('광합성', '는')).toBe('은');
  });
});

describe('따옴표 자료', () => {
  const raw = `제목: 광합성
"광합성"은 식물이 "빛 에너지"를 이용해 "포도당"을 만드는 과정이다.

# 세포 호흡
**내용:** "미토콘드리아"에서 포도당을 분해해 "ATP."를 얻는다. "이 문장은 따옴표지만 길어서 인용으로 남아야 하는 글입니다"`;

  it('제목마다 카드, 첫 제목이 이름, 따옴표 낱말과 조사 경계', () => {
    const m = parseQuotedMaterial(raw)!;
    expect(m.title).toBe('광합성');
    expect(m.sections.map((s) => s.title)).toEqual(['광합성', '세포 호흡']);
    expect(m.terms).toEqual(['광합성', '빛 에너지', '포도당', '미토콘드리아', 'ATP']);
    expect(m.splits['광합성은']).toEqual({ n: 3, by: 'quote' });
    expect(m.splits['에너지를']).toEqual({ n: 3, by: 'quote' });
    expect(m.sections[1]!.text).toContain('ATP.를');
    expect(m.sections[1]!.text).toContain('"이 문장은');
    expect(m.sections[1]!.text.startsWith('미토콘드리아')).toBe(true);
  });

  it('책으로 세우면 빈칸이 다 선다', () => {
    const book = bookFromMaterial(parseQuotedMaterial(raw)!, '자료');
    const index = buildIndex(book);
    expect(new Set(index.spots.map((s) => s.key))).toEqual(new Set(['광합성', '빛 에너지', '포도당', '미토콘드리아', 'atp']));
    const photo = index.spotsOf('광합성')[0]!;
    expect(book.pages[0]!.text.slice(photo.end, photo.tailEnd)).toBe('은');
  });

  it('그냥 글은 자료가 아니다 · 부탁 글은 걷는다', () => {
    expect(parseQuotedMaterial('그냥 메모입니다.')).toBeNull();
    expect(withoutMaterialPrompt(`${MATERIAL_PROMPT}광합성`)).toBe('');
    expect(withoutMaterialPrompt(`${MATERIAL_PROMPT}광합성\n\n제목: 광합성\n"광합성"은`)).toBe('제목: 광합성\n"광합성"은');
  });

  it('예시 넷이 모두 문제를 낸다', () => {
    for (const s of SAMPLES) {
      const book = sampleBook(s);
      const index = buildIndex(book);
      expect(quizPageIds(index).length, s.id).toBe(book.pages.length);
      for (const t of book.terms) expect(index.spotsOf(termKey(t.text)).length, `${s.id}: ${t.text}`).toBeGreaterThan(0);
    }
    const db = buildIndex(sampleBook(SAMPLES.find((s) => s.id === 'db')!));
    const acid = db.spotsOf('acid')[0]!;
    expect(db.book.pages[acid.page]!.text.slice(acid.start, acid.tailEnd)).toBe('ACID라고');
  });
});

describe('카드 글의 따옴표', () => {
  const base = (): BlankBook => {
    let b = newBook('t', [newPage('a', '광합성은 엽록체에서 일어난다. 광합성의 결과로 산소가 나온다.')]);
    b = toggleTerm(b, '광합성');
    return b;
  };

  it('외울 낱말이 선 자리를 다 감싼다', () => {
    expect(quotedText(buildIndex(base()), 0)).toBe('"광합성"은 엽록체에서 일어난다. "광합성"의 결과로 산소가 나온다.');
  });

  it('따옴표를 더하면 낱말이 되고 경계가 적힌다', () => {
    const next = applyQuotedText(base(), 0, '"광합성"은 "엽록체"에서 일어난다. "광합성"의 결과로 산소가 나온다.');
    expect(next.terms.map((t) => t.text)).toEqual(['광합성', '엽록체']);
    expect(next.splits['엽록체에서']).toEqual({ n: 3, by: 'quote' });
    expect(next.pages[0]!.text).toBe('광합성은 엽록체에서 일어난다. 광합성의 결과로 산소가 나온다.');
  });

  it('따옴표를 다 벗기면 책에서 뺀다 · 하나라도 남으면 둔다 · 말째 지우면 어디에도 안 설 때만', () => {
    const off = applyQuotedText(base(), 0, '광합성은 엽록체에서 일어난다. 광합성의 결과로 산소가 나온다.');
    expect(off.terms).toEqual([]);
    const half = applyQuotedText(base(), 0, '광합성은 엽록체에서 일어난다. "광합성"의 결과로 산소가 나온다.');
    expect(half.terms.map((t) => t.text)).toEqual(['광합성']);
    const gone = applyQuotedText(base(), 0, '엽록체에서 일어난다.');
    expect(gone.terms).toEqual([]);
  });

  it('어절 가운데서 연 따옴표는 안 남긴다 · 칩은 치는 대로', () => {
    const odd = applyQuotedText(base(), 0, '광"합성"은 엽록체에서 일어난다.');
    expect(odd.terms.some((t) => t.text === '합성')).toBe(false);
    expect(quotedTerms('"광합성"은 "엽록체"와 "광합성"')).toEqual(['광합성', '엽록체']);
  });
});

describe('책 · 쪽', () => {
  it('덩어리 낱말 · 사람이 고친 조사 경계를 따라간다', () => {
    let b = newBook('t', [newPage('', '세포 호흡은 미토콘드리아에서 일어난다. 가속도는 빨라진다.')]);
    b = toggleTerm(b, '세포 호흡');
    b = toggleTerm(b, '가속');
    // 짐작은 '가속도는' → '가속도' + '는' — '가속'은 서지 않는다.
    expect(buildIndex(b).spotsOf('가속')).toHaveLength(0);
    expect(buildIndex(b).spotsOf('세포 호흡')).toHaveLength(1);
    b = followSplits(b, { ...b.splits, 가속도는: { n: 2, by: 'manual' } });
    expect(buildIndex(b).spotsOf('가속')).toHaveLength(1);
  });

  it('쪽을 지우면 그 쪽에만 서던 낱말도 빠지고, 옮기면 따라간다', () => {
    let a = newBook('a', [newPage('1', '광합성은 빛을 쓴다.'), newPage('2', '포도당이 생긴다.')]);
    a = toggleTerm(toggleTerm(a, '광합성'), '포도당');
    expect(removePage(a, 1).terms.map((t) => t.text)).toEqual(['광합성']);
    const [from, to] = movePage(a, 1, newBook('b'));
    expect(from.terms.map((t) => t.text)).toEqual(['광합성']);
    expect(to.terms.map((t) => t.text)).toEqual(['포도당']);
    expect(to.pages[0]!.title).toBe('2');
  });
});

describe('맞춰 보기', () => {
  const book = (() => {
    let b = newBook('t', [newPage('a', '광합성은 엽록체에서 일어난다. 광합성은 빛을 쓴다.'), newPage('b', '아무 낱말도 없다.'), newPage('c', 'ATP를 얻는다.')]);
    b = toggleTerm(toggleTerm(b, '광합성'), 'ATP');
    return b;
  })();
  const index = buildIndex(book);

  it('외울 낱말이 선 쪽마다 한 문제 · 틀린 것만', () => {
    expect(quizPageIds(index)).toEqual([book.pages[0]!.id, book.pages[2]!.id]);
    const first = pickQuestion(index, {}, new Set(), null, seq(0.1, 0.9, 0))!;
    const second = pickQuestion(index, {}, new Set([first.pageId]), null, seq(0.5))!;
    expect(new Set([first.pageId, second.pageId]).size).toBe(2);
    expect(pickQuestion(index, {}, new Set([first.pageId, second.pageId]), null)).toBeNull();
    expect(pickQuestion(index, {}, new Set(), new Set([book.pages[2]!.id]))!.answer).toBe('ATP');
  });

  it('안 푼 것 · 틀린 것이 먼저', () => {
    const stats = { 광합성: { seen: 3, right: 3, lastAt: 1, lastCorrect: true } };
    expect(pickQuestion(index, stats, new Set(), null, seq(0))!.answer).toBe('ATP');
  });

  it('같은 낱말의 다른 자리는 가린다', () => {
    const item = pickQuestion(index, {}, new Set(), new Set([book.pages[0]!.id]), seq(0))!;
    expect(item.particle).toBe('은');
    const range = quizRange(book.pages[0]!.text, item.spot);
    expect(maskedIn(index, item, range)).toHaveLength(1);
  });

  it('채점 — 조사까지 쳐도 맞고, 띄어쓰기 무시, 긴 로마자 한 글자 오타', () => {
    const item = { answer: '광합성', particle: '은' };
    expect(isCorrectAnswer('광합성', item)).toBe(true);
    expect(isCorrectAnswer('광합성은', item)).toBe(true);
    expect(isCorrectAnswer('광합', item)).toBe(false);
    expect(isCorrectAnswer('빛에너지', { answer: '빛 에너지', particle: '' })).toBe(false);
    expect(isCorrectAnswer('빛에너지', { answer: '빛 에너지', particle: '' }, true)).toBe(true);
    expect(isCorrectAnswer('빛  에너지', { answer: '빛 에너지', particle: '' })).toBe(true);
    expect(isCorrectAnswer('postpone', { answer: 'postponed', particle: '' })).toBe(true);
    expect(isCorrectAnswer('ATB', { answer: 'ATP', particle: '' })).toBe(false);
  });

  it('글자 차이와 긴 글의 둘레', () => {
    const d = charDiff('광합성', '광함성');
    expect(d.answer.filter(([, same]) => !same).map(([c]) => c)).toEqual(['합']);
    expect(d.typed.filter(([, same]) => !same).map(([c]) => c)).toEqual(['함']);
    const long = `${'가'.repeat(400)}. 광합성은 빛을 쓴다. ${'나'.repeat(400)}.`;
    const at = long.indexOf('광합성');
    const [s, e] = contextRange(long, at, at + 3, 480);
    expect(long.slice(s, e)).toContain('광합성은 빛을 쓴다.');
    expect(e - s).toBeLessThan(500);
  });
});

describe('규칙으로 먼저 칠하기', () => {
  it('되풀이 · 괄호 · 정의의 머리 · 로마자 용어를 고르고 흔한 말은 뺀다', () => {
    const text = '광합성(photosynthesis)은 빛을 쓴다. 광합성은 엽록체에서 일어난다. 엽록체란 식물 세포의 기관이다. 그리고 ATP를 만든다.';
    const picked = pickKeyTerms(text, 5).map((t) => t.text);
    expect(picked).toEqual(expect.arrayContaining(['광합성', '엽록체', 'ATP']));
    expect(picked).not.toContain('그리고');
  });
});

describe('타자', () => {
  it('두벌식 타수', () => {
    expect(keystrokes('광합성')).toBe(10);
    expect(keystrokes('의')).toBe(3); // ㅇ + ㅢ(2)
    expect(keystrokes('닭')).toBe(4); // ㄷ + ㅏ + ㄺ(2)
    expect(keystrokes(' ATP ')).toBe(3);
  });
  it('등급과 통계', () => {
    expect(rankFor(0).name).toBe('도토리');
    expect(rankFor(205).name).toBe('큰 나무');
    expect(nextRankAfter(430)).toBeNull();
    const r = (i: number, keys: number, ms: number): TypingRound => ({ id: `r${i}`, bookId: 'b', at: Date.now() - i, answers: 3, correct: 3, measured: 3, keys, typingMs: ms });
    const s1 = typingStats([r(1, 20, 6000), r(2, 40, 12000)]);
    expect(s1.placementLeft).toBe(1);
    expect(s1.rank).toBeNull();
    expect(s1.best?.id).toBe('r2');
    const s2 = typingStats([r(1, 20, 6000), r(2, 40, 12000), r(3, 40, 8000)]);
    expect(Math.round(s2.totalCpm!)).toBe(231); // 100타 ÷ 26초
    expect(s2.rank?.name).toBe('큰 나무');
    expect(s2.days).toHaveLength(14);
  });
});

describe('장부', () => {
  it('기록은 횟수만 · 깨진 값은 걸러 · 가져오기는 겹치지 않게', () => {
    const book = sampleBook(SAMPLES[0]!);
    let s = upsertBook(EMPTY_STORE, book);
    s = recordAnswer(s, book.id, '광합성', false);
    s = recordAnswer(s, book.id, '광합성', true);
    expect(s.stats[book.id]!['광합성']).toMatchObject({ seen: 2, right: 1, lastCorrect: true });
    expect(s.books[0]!.studiedAt).not.toBeNull();
    expect(sanitizeStore('x')).toEqual(EMPTY_STORE);
    const back = sanitizeStore(JSON.parse(JSON.stringify(s)));
    expect(back.books[0]!.terms.length).toBe(book.terms.length);
    expect(mergeStore(back, back).books).toHaveLength(1);
  });
});

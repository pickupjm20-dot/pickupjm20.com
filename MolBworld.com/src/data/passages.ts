/**
 * 찍먹 지문 셋 — 앱의 번들 읽을거리(`assets/reading/text/refresh_*.txt`)를 그대로 옮겨 왔다.
 * 낱말 풀이 · 문장 해석이 글 파일에 미리 적혀 있어 AI 없이 앱의 리더와 같은 답을 낸다.
 *
 * 지문을 바꾸려면 MolB에서 고르고 `scripts/import_assets.py`의 PASSAGES를 고친 뒤 다시 돌린다.
 */
import { parsePassageFile, readingsByText, type SentenceReading } from '../lib/gloss';
import { buildDoc, type Doc } from '../lib/text';
import warmBowl from '../content/passages/refresh_0.txt?raw';
import bananas from '../content/passages/refresh_2.txt?raw';
import smallStart from '../content/passages/refresh_14.txt?raw';

export type Passage = {
  id: string;
  title: string;
  image: string;
  level: string;
  band: string;
  topic: string;
  minutes: number;
  /** 이 지문을 고른 까닭 — 카드에 한 줄. */
  intent: string;
  doc: Doc;
  readings: SentenceReading[];
  byText: Map<string, SentenceReading>;
};

function make(id: string, raw: string, meta: Pick<Passage, 'level' | 'band' | 'topic' | 'minutes' | 'intent'>): Passage {
  const parsed = parsePassageFile(raw);
  return {
    id,
    title: parsed.title,
    image: parsed.image,
    ...meta,
    doc: buildDoc(parsed.body),
    readings: parsed.readings,
    byText: readingsByText(parsed.readings),
  };
}

export const PASSAGES: Passage[] = [
  make('warm-bowl', warmBowl, {
    level: '쉬움',
    band: 'A1–A2',
    topic: '생활 · 요리',
    minutes: 1,
    intent: '처음이라면 여기서 — 짧은 문장 다섯, 매일 쓰는 낱말.',
  }),
  make('curving-bananas', bananas, {
    level: '보통',
    band: 'B1',
    topic: '과학 · 호기심',
    minutes: 1,
    intent: '‘against gravity’처럼 아는 낱말이 모여 새 뜻이 되는 글.',
  }),
  make('small-start', smallStart, {
    level: '조금 어려움',
    band: 'B1–B2',
    topic: '습관 · 생각',
    minutes: 2,
    intent: '긴 문장 속에 ‘less than’ · ‘starting point’ 같은 덩어리가 숨어 있어요.',
  }),
];

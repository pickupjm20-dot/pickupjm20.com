import { describe, expect, it } from 'vitest';
import { PASSAGES } from '../data/passages';
import { entryFor, inflects, parseWordLine, phraseAt, readingFor } from './gloss';
import { gradeMeaning } from './quiz';
import { buildDoc, splitParagraphs, splitSentences } from './text';

describe('text', () => {
  it('splits sentences like the app, keeping Mr. Kim together', () => {
    expect(splitSentences('If it breaks, call Mr. Kim at 204. He can fix it. “Really?” she asked.')).toEqual([
      'If it breaks, call Mr. Kim at 204.',
      'He can fix it.',
      '“Really?” she asked.',
    ]);
  });

  it('uses blank lines as paragraphs when present, line breaks otherwise', () => {
    expect(splitParagraphs('a\nb\n\nc')).toEqual(['a b', 'c']);
    expect(splitParagraphs('a\nb')).toEqual(['a', 'b']);
  });
});

describe('passages', () => {
  it('every body sentence of every passage has its prewritten reading', () => {
    for (const p of PASSAGES) {
      expect(p.readings.length).toBeGreaterThan(0);
      for (const para of p.doc.paragraphs) {
        for (const s of para.sentences) {
          const r = readingFor(p.byText, p.readings, s);
          expect(r?.english, `${p.id}: ${s.text}`).toBe(s.text);
          expect(r?.korean).toBeTruthy();
        }
      }
    }
  });

  it('almost every word of the passages has a gloss (the reader never needs AI)', () => {
    for (const p of PASSAGES) {
      let words = 0;
      let glossed = 0;
      for (const para of p.doc.paragraphs) {
        for (const s of para.sentences) {
          const r = readingFor(p.byText, p.readings, s);
          for (const t of s.tokens) {
            if (!t.word) continue;
            words++;
            if (entryFor(r, t.text)) glossed++;
          }
        }
      }
      expect(glossed / words, p.id).toBeGreaterThan(0.85);
    }
  });

  it('finds the base form and phrases the file wrote', () => {
    const bowl = PASSAGES[0]!;
    const s = bowl.doc.paragraphs[0]!.sentences[1]!; // Try rice with an egg and your favorite vegetables.
    const r = readingFor(bowl.byText, bowl.readings, s);
    expect(entryFor(r, 'vegetables')).toMatchObject({ lemma: 'vegetable', meaning: '채소' });

    const small = PASSAGES[2]!;
    const s2 = small.doc.paragraphs[0]!.sentences[1]!; // ... takes less than a minute ...
    const r2 = readingFor(small.byText, small.readings, s2);
    const at = s2.tokens.findIndex((t) => t.key === 'than');
    expect(phraseAt(r2, s2, at)?.word).toBe('less than');
  });
});

describe('gloss lines', () => {
  it('reads surface (lemma): meaning, keeping colons inside the meaning', () => {
    expect(parseWordLine('gathers (gather): 모으다')).toEqual({ word: 'gathers', lemma: 'gather', meaning: '모으다', phrase: false });
    expect(parseWordLine('do: (의문문을 만드는 말)')).toMatchObject({ word: 'do', meaning: '(의문문을 만드는 말)' });
    expect(parseWordLine('starting point: 출발점')?.phrase).toBe(true);
  });

  it('inflects only on common tails', () => {
    expect(inflects('study', 'studied')).toBe(true);
    expect(inflects('stop', 'stopped')).toBe(true);
    expect(inflects('art', 'artist')).toBe(false);
  });
});

describe('quiz grading', () => {
  it('accepts any listed meaning and ignores spacing and tildes', () => {
    expect(gradeMeaning('원하다', '원하다, ~하고 싶다')).toBe(true);
    expect(gradeMeaning('하고 싶다', '원하다, ~하고 싶다')).toBe(true);
    expect(gradeMeaning('먹어보다', '(한번) 먹어 보다')).toBe(true);
    expect(gradeMeaning('그릇', '(우묵한) 그릇')).toBe(true);
    expect(gradeMeaning('달리다', '원하다, ~하고 싶다')).toBe(false);
    expect(gradeMeaning('', '그릇')).toBe(false);
  });
});


describe('doc', () => {
  it('builds a doc with global sentence indexes', () => {
    const doc = buildDoc('One. Two.\n\nThree.');
    expect(doc.paragraphs.map((p) => p.sentences.map((s) => s.index))).toEqual([[0, 1], [2]]);
    expect(doc.wordCount).toBe(3);
  });
});

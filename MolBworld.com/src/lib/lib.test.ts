import { describe, expect, it } from 'vitest';
import { PASSAGES } from '../data/passages';
import { buildDictionary, lookup } from './dictionary';
import { entryFor, inflects, parseWordLine, phraseAt, readingFor } from './gloss';
import { candidates, matchesAny } from './lemma';
import { addBook, addWord, deleteBook, displayWord, EMPTY_LIBRARY, mergeLibrary, recordQuiz, sanitizeLibrary } from './library';
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

describe('lemma candidates', () => {
  it('offers the surface first, then plausible bases', () => {
    expect(candidates('Running')[0]).toBe('running');
    expect(candidates('running')).toContain('run');
    expect(candidates('went')).toContain('go');
    expect(candidates('studies')).toContain('study');
    expect(candidates('liked')).toContain('like');
    expect(candidates('gently')).toContain('gentle');
    expect(candidates('easily')).toContain('easy');
    expect(candidates('leaves')).toEqual(expect.arrayContaining(['leave', 'leaf']));
    expect(candidates("didn't")).toContain('do');
    expect(candidates("can't")).toContain('can');
    expect(candidates("I'm")).toContain('i');
    expect(candidates('an')).toContain('a');
  });

  it('matches inflected forms against saved words for highlighting', () => {
    const saved = new Set(['vegetable', 'go']);
    expect(matchesAny('Vegetables', saved)).toBe('vegetable');
    expect(matchesAny('went', saved)).toBe('go');
    expect(matchesAny('bowl', saved)).toBeNull();
  });
});

describe('dictionary', () => {
  const dict = buildDictionary([
    ['build', '짓다', 'verb', '', 'A2'],
    ['building', '건물', 'noun', '', 'A1'],
    ['run', '달리다', 'verb', '', 'A1'],
    ['gravity', '', '', '', 'B2'],
  ]);
  it('prefers the dictionary hit that comes first', () => {
    expect(lookup(dict, 'building').entry?.ko).toBe('건물');
    expect(lookup(dict, 'running')).toMatchObject({ lemma: 'run' });
  });
  it('keeps level-only rows and misses gracefully', () => {
    expect(lookup(dict, 'gravity')).toMatchObject({ lemma: 'gravity', entry: { level: 'B2', ko: '' } });
    expect(lookup(dict, 'zyzzyva')).toEqual({ lemma: 'zyzzyva', entry: null });
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

describe('library', () => {
  it('adds books and words, keeping the first sentence of a word', () => {
    let { lib, book } = addBook(EMPTY_LIBRARY, '', 'Hello world.\nSecond line');
    expect(book.title).toBe('Hello world.');
    lib = addWord(lib, { id: 'World', surface: 'world', meaning: '', sentence: 'Hello world.', bookId: book.id, from: '' });
    lib = addWord(lib, { id: 'world', surface: 'worlds', meaning: '세계', sentence: 'Other.', bookId: null, from: '' });
    expect(lib.words).toHaveLength(1);
    expect(lib.words[0]).toMatchObject({ id: 'world', sentence: 'Hello world.', meaning: '세계' });
  });

  it('keeps words when their book is deleted and counts quiz results without scheduling', () => {
    let { lib, book } = addBook(EMPTY_LIBRARY, 'B', 'x');
    lib = addWord(lib, { id: 'x', surface: 'x', meaning: 'm', sentence: 's', bookId: book.id, from: '' });
    lib = recordQuiz(lib, 'x', false);
    lib = deleteBook(lib, book.id);
    expect(lib.books).toHaveLength(0);
    expect(lib.words[0]).toMatchObject({ bookId: null, from: 'B', wrong: 1, right: 0 });
  });

  it('sanitizes garbage and merges imports without duplicates', () => {
    expect(sanitizeLibrary('nope')).toEqual(EMPTY_LIBRARY);
    const incoming = sanitizeLibrary({ books: [{ id: 'b1', title: 'T', text: 'x' }, { nope: 1 }], words: [{ id: 'a' }, { id: 'a' }] });
    expect(incoming.books).toHaveLength(1);
    expect(incoming.words).toHaveLength(1);
    const merged = mergeLibrary(incoming, incoming);
    expect(merged.books).toHaveLength(1);
    expect(merged.words).toHaveLength(1);
  });

  it('shows names as written and everything else in base form', () => {
    expect(displayWord({ id: 'molbi', surface: 'Molbi', sentence: 'Then Molbi smiled.' })).toBe('Molbi');
    expect(displayWord({ id: 'please', surface: 'Please', sentence: 'Please submit it.' })).toBe('please');
    expect(displayWord({ id: 'smell', surface: 'smelled', sentence: 'It smelled good.' })).toBe('smell');
  });

  it('builds a doc with global sentence indexes', () => {
    const doc = buildDoc('One. Two.\n\nThree.');
    expect(doc.paragraphs.map((p) => p.sentences.map((s) => s.index))).toEqual([[0, 1], [2]]);
    expect(doc.wordCount).toBe(3);
  });
});

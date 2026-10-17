/** 단어장 — 이 책 / 전체, 찾기, 뜻 고치기, 뜻 적기 퀴즈, CSV 내보내기. */
import { useMemo, useState } from 'react';
import { DownloadIcon, SearchIcon, TrashIcon } from '../../components/Icons';
import { QuizRunner } from '../../components/QuizRunner';
import { ReviewOffBadge } from '../../components/ReviewOffBadge';
import { download, today, wordsToCsv } from '../../lib/download';
import { displayWord, type SavedWord } from '../../lib/library';

export function WordsPanel({
  words,
  bookId,
  bookTitle,
  onMeaning,
  onRemove,
  onQuizResult,
}: {
  words: SavedWord[];
  bookId: string | null;
  bookTitle: string;
  onMeaning: (id: string, meaning: string) => void;
  onRemove: (id: string) => void;
  onQuizResult: (id: string, correct: boolean) => void;
}) {
  const [scope, setScope] = useState<'book' | 'all'>(bookId ? 'book' : 'all');
  const [q, setQ] = useState('');
  const [quiz, setQuiz] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  const effective = bookId ? scope : 'all';
  const inScope = useMemo(
    () => (effective === 'book' ? words.filter((w) => w.bookId === bookId) : words),
    [words, effective, bookId],
  );
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return inScope;
    return inScope.filter((w) => w.id.includes(needle) || w.meaning.includes(needle) || w.sentence.toLowerCase().includes(needle));
  }, [inScope, q]);
  const bookCount = bookId ? words.filter((w) => w.bookId === bookId).length : 0;

  if (quiz) {
    return (
      <div className="words">
        <QuizRunner
          title={effective === 'book' ? `${bookTitle} · 뜻 적기` : '전체 단어 · 뜻 적기'}
          items={inScope.map((w) => ({ id: w.id, word: displayWord(w), meaning: w.meaning, sentence: w.sentence }))}
          onResult={onQuizResult}
          onClose={() => setQuiz(false)}
        />
      </div>
    );
  }

  return (
    <div className="words">
      <div className="words__head">
        <h2>단어장</h2>
        <ReviewOffBadge align="right" />
      </div>
      {bookId && (
        <div className="seg" role="tablist" aria-label="단어장 범위">
          <button type="button" role="tab" aria-selected={effective === 'book'} onClick={() => setScope('book')}>
            이 책 <span>{bookCount}</span>
          </button>
          <button type="button" role="tab" aria-selected={effective === 'all'} onClick={() => setScope('all')}>
            전체 <span>{words.length}</span>
          </button>
        </div>
      )}
      <div className="words__search">
        <SearchIcon size={16} />
        <label className="sr-only" htmlFor="word-search">
          단어 찾기
        </label>
        <input id="word-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="단어 · 뜻 · 문장으로 찾기" />
      </div>
      <div className="words__actions">
        <button
          type="button"
          className="btn btn--primary btn--sm"
          disabled={!inScope.some((w) => w.meaning.trim())}
          onClick={() => setQuiz(true)}
        >
          뜻 적기 퀴즈
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          disabled={inScope.length === 0}
          onClick={() => download(`molb-words-${today()}.csv`, wordsToCsv(inScope), 'text/csv')}
        >
          <DownloadIcon size={16} /> CSV
        </button>
      </div>

      {shown.length === 0 ? (
        <p className="words__empty">
          {inScope.length === 0 ? '아직 담은 단어가 없어요. 본문에서 모르는 단어를 톡 눌러 보세요.' : '찾는 단어가 없어요.'}
        </p>
      ) : (
        <ul className="words__list">
          {shown.map((w) => (
            <li key={w.id} className="word-row">
              <div className="word-row__top">
                <b className="word-row__word">{displayWord(w)}</b>
                {w.level && <span className={`chip chip--level levels__seg--${w.level}`}>{w.level}</span>}
                <button
                  type="button"
                  className="icon-btn icon-btn--sm word-row__del"
                  aria-label={`${w.id} 지우기`}
                  onClick={() => onRemove(w.id)}
                >
                  <TrashIcon size={14} />
                </button>
              </div>
              {editing === w.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const v = new FormData(e.currentTarget).get('m');
                    onMeaning(w.id, String(v ?? '').trim());
                    setEditing(null);
                  }}
                >
                  <label className="sr-only" htmlFor={`m-${w.id}`}>
                    {w.id}의 뜻
                  </label>
                  <input
                    id={`m-${w.id}`}
                    name="m"
                    className="field field--sm"
                    defaultValue={w.meaning}
                    autoFocus
                    onBlur={(e) => {
                      onMeaning(w.id, e.currentTarget.value.trim());
                      setEditing(null);
                    }}
                  />
                </form>
              ) : (
                <button type="button" className="word-row__meaning" onClick={() => setEditing(w.id)}>
                  {w.meaning || <span className="word-row__blank">뜻을 적어 주세요</span>}
                </button>
              )}
              {w.sentence && <p className="word-row__sentence">{w.sentence}</p>}
              <p className="word-row__meta">
                {w.from && <span>{w.from}</span>}
                <span>{new Date(w.addedAt).toLocaleDateString('ko-KR')}</span>
                {(w.right > 0 || w.wrong > 0) && (
                  <span>
                    맞힘 {w.right} · 틀림 {w.wrong}
                  </span>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

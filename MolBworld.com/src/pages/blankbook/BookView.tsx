/**
 * 책 읽기 — 찍먹과 같은 리더 위에서, 풀이는 내장 사전이 낸다. 톡은 바로 담기(뜻은 사전의 것, 없으면 빈칸),
 * 꾹은 보기만. 담은 낱말의 형광펜은 글 전체 · 모든 책에 남는다(앱처럼 낱말이 열쇠라서).
 */
import { useEffect, useMemo, useState } from 'react';
import { CloseIcon, EditIcon, HandTapIcon, TrashIcon } from '../../components/Icons';
import { Reader, type Spot, type WordHit, type WordState } from '../../components/Reader';
import { lookup, posLabel, type DictEntry, type Dictionary } from '../../lib/dictionary';
import { matchesAny, quickLemma } from '../../lib/lemma';
import type { Book, SavedWord } from '../../lib/library';
import { buildDoc, markInSentence, type Sentence } from '../../lib/text';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;

type Pick = { spot: Spot; surface: string; lemma: string; entry: DictEntry | null; sentence: Sentence; tokenIndex: number; kind: 'tap' | 'peek' };

export function BookView({
  book,
  words,
  dict,
  dictError,
  onCollect,
  onRemove,
  onMeaning,
  onEdit,
  onDelete,
}: {
  book: Book;
  words: SavedWord[];
  dict: Dictionary | null;
  dictError: boolean;
  onCollect: (w: { id: string; surface: string; meaning: string; sentence: string; level: string }) => void;
  onRemove: (id: string) => void;
  onMeaning: (id: string, meaning: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const doc = useMemo(() => buildDoc(book.text), [book.text]);
  const ids = useMemo(() => new Set(words.map((w) => w.id)), [words]);
  const [peeked, setPeeked] = useState<Set<string>>(new Set());
  const [pick, setPick] = useState<Pick | null>(null);

  useEffect(() => {
    setPick(null);
    setPeeked(new Set());
  }, [book.id]);

  const resolve = (hit: WordHit, kind: 'tap' | 'peek'): Pick => {
    const found = dict ? lookup(dict, hit.token.text) : { lemma: quickLemma(hit.token.text), entry: null };
    return {
      spot: { s: hit.sentence.index, t: hit.tokenIndex },
      surface: hit.token.text,
      lemma: found.lemma,
      entry: found.entry,
      sentence: hit.sentence,
      tokenIndex: hit.tokenIndex,
      kind,
    };
  };

  const onTap = (hit: WordHit) => {
    const p = resolve(hit, 'tap');
    setPick(p);
    if (!ids.has(p.lemma)) {
      onCollect({ id: p.lemma, surface: p.surface, meaning: p.entry?.ko ?? '', sentence: p.sentence.text, level: p.entry?.level ?? '' });
    }
  };

  const onPeek = (hit: WordHit) => {
    const p = resolve(hit, 'peek');
    setPick(p);
    setPeeked((s) => new Set(s).add(p.lemma));
  };

  const wordState = (t: { text: string }): WordState => {
    if (matchesAny(t.text, ids)) return 'marked';
    if (matchesAny(t.text, peeked)) return 'peeked';
    return null;
  };

  // 이 글의 낱말 등급 — 서로 다른 낱말마다 사전의 CEFR 등급을 센다. 기능어(the · and)와 이름 · 사전 밖 낱말은
  // 등급이 없어 한 칸('등급 없음')에 모인다.
  const levels = useMemo(() => {
    if (!dict) return null;
    const seen = new Set<string>();
    const count: Record<string, number> = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, out: 0 };
    for (const p of doc.paragraphs)
      for (const s of p.sentences)
        for (const t of s.tokens) {
          if (!t.word || /^\d+$/.test(t.key)) continue;
          const { lemma, entry } = lookup(dict, t.text);
          if (seen.has(lemma)) continue;
          seen.add(lemma);
          const lv = entry?.level ?? '';
          const k = lv && lv in count ? lv : 'out';
          count[k] = (count[k] ?? 0) + 1;
        }
    return { count, total: seen.size };
  }, [dict, doc]);

  const saved = pick ? words.find((w) => w.id === pick.lemma) : undefined;

  return (
    <article className="book">
      <header className="book__head">
        <div>
          <p className="book__meta">
            문장 {doc.sentenceCount} · 낱말 {doc.wordCount} · 이 책에서 담은 {words.filter((w) => w.bookId === book.id).length}
          </p>
          <h2 className="book__title">{book.title}</h2>
        </div>
        <div className="book__tools">
          <button type="button" className="icon-btn" aria-label="책 고치기" onClick={onEdit}>
            <EditIcon size={18} />
          </button>
          <button type="button" className="icon-btn icon-btn--danger" aria-label="책 지우기" onClick={onDelete}>
            <TrashIcon size={18} />
          </button>
        </div>
      </header>

      {levels && levels.total > 0 && (
        <div className="levels" aria-label="이 글의 낱말 등급">
          <div className="levels__bar">
            {[...LEVELS, 'out' as const].map((lv) => {
              const n = levels.count[lv] ?? 0;
              if (!n) return null;
              return (
                <span
                  key={lv}
                  className={`levels__seg levels__seg--${lv}`}
                  style={{ flexGrow: n }}
                  title={`${lv === 'out' ? '등급 없음' : lv} ${n}개`}
                />
              );
            })}
          </div>
          <p className="levels__legend">
            {[...LEVELS, 'out' as const].map((lv) => (
              <span key={lv}>
                <i className={`levels__dot levels__seg--${lv}`} aria-hidden="true" />
                {lv === 'out' ? '등급 없음' : lv} {levels.count[lv] ?? 0}
              </span>
            ))}
          </p>
        </div>
      )}
      {dictError && <p className="book__warn">내장 사전을 받지 못했어요. 낱말은 담기지만 뜻은 직접 적어야 해요.</p>}

      <p className="reader-panel__tip">
        <HandTapIcon size={16} /> 모르는 단어는 <b>톡</b> — 담기 · 헷갈리면 <b>꾹</b> — 보기만
      </p>
      <div className="book__body">
        <Reader label={book.title} doc={doc} wordState={wordState} active={pick?.spot ?? null} onTap={onTap} onPeek={onPeek} />
      </div>

      {pick && (
        <div className="reader-panel__dock">
          <DictCard
            pick={pick}
            saved={saved}
            onClose={() => setPick(null)}
            onRemove={() => onRemove(pick.lemma)}
            onCollect={() =>
              onCollect({
                id: pick.lemma,
                surface: pick.surface,
                meaning: pick.entry?.ko ?? '',
                sentence: pick.sentence.text,
                level: pick.entry?.level ?? '',
              })
            }
            onMeaning={(m) => onMeaning(pick.lemma, m)}
          />
        </div>
      )}
    </article>
  );
}

function DictCard({
  pick,
  saved,
  onClose,
  onRemove,
  onCollect,
  onMeaning,
}: {
  pick: Pick;
  saved: SavedWord | undefined;
  onClose: () => void;
  onRemove: () => void;
  onCollect: () => void;
  onMeaning: (m: string) => void;
}) {
  const [draft, setDraft] = useState(saved?.meaning ?? pick.entry?.ko ?? '');
  useEffect(() => {
    setDraft(saved?.meaning ?? pick.entry?.ko ?? '');
  }, [pick.lemma, saved?.meaning, pick.entry?.ko]);

  const m = markInSentence(pick.sentence, pick.tokenIndex);
  const e = pick.entry;
  const commit = () => {
    if (saved && draft.trim() !== saved.meaning) onMeaning(draft.trim());
  };

  return (
    <div className="wcard" role="dialog" aria-label={`${pick.surface} 풀이`}>
      <div className="wcard__top">
        <p className="wcard__head">
          <strong>{pick.surface}</strong>
          {e?.ko ? <> · {e.ko}</> : <span className="wcard__none"> · 내장 사전에 뜻이 없어요</span>}
        </p>
        <button type="button" className="icon-btn icon-btn--sm" aria-label="풀이 닫기" onClick={onClose}>
          <CloseIcon size={16} />
        </button>
      </div>
      <div className="wcard__chips">
        {pick.lemma !== pick.surface.toLowerCase() && <span className="chip">원형 {pick.lemma}</span>}
        {e?.pos && <span className="chip">{posLabel(e.pos)}</span>}
        {e?.ipa && <span className="chip chip--faint">{e.ipa}</span>}
        {e?.level && <span className={`chip chip--level levels__seg--${e.level}`}>{e.level}</span>}
        {saved ? (
          <span className="chip chip--growth">단어장에 담았어요</span>
        ) : pick.kind === 'peek' ? (
          <span className="chip chip--action">꾹 · 보기만 했어요</span>
        ) : null}
      </div>
      <p className="wcard__sentence">
        {m.before}
        <b>{m.word}</b>
        {m.after}
      </p>
      {saved ? (
        <form
          className="wcard__meaning"
          onSubmit={(ev) => {
            ev.preventDefault();
            commit();
          }}
        >
          <label htmlFor="meaning-input">이 문장에서의 뜻</label>
          <input
            id="meaning-input"
            className="field field--sm"
            value={draft}
            onChange={(ev) => setDraft(ev.target.value)}
            onBlur={commit}
            placeholder={e?.ko ? e.ko : '뜻을 적어 두면 퀴즈에도 나와요'}
          />
        </form>
      ) : null}
      <div className="wcard__actions">
        {saved ? (
          <button type="button" className="link-btn" onClick={onRemove}>
            아는 단어였어요 — 빼기
          </button>
        ) : (
          <button type="button" className="link-btn" onClick={onCollect}>
            단어장에 담기
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * 개념 필기 — 주제 카드들(앱 블랭크북 8절). 카드 = 접기 ▼ · 제목 칸 · 내용 칸(외울 낱말이 "따옴표"로 선 글) · 칩 · [칠하기] · 옮기기 · 삭제.
 *
 * 따옴표 + 칠하기: 카드의 내용 칸엔 외울 낱말이 선 자리를 따옴표로 감싼 글이 선다. 치면 칩이 바로 서고, 0.7초 쉬거나 칸을 떠나면 책에
 * 들인다(applyQuotedText). [칠하기]를 켜면 내용이 누르는 글로 바뀐다 — 눌러 칠하고 빼기, 꾹 눌러 조사 고치기.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog } from '../../components/Dialog';
import { PlusIcon, TrashIcon } from '../../components/Icons';
import {
  buildIndex,
  followSplits,
  hasTerm,
  movePage,
  newPage,
  removePage,
  termKey,
  toggleTerm,
  type BlankBook,
  type BlankToken,
  type BookIndex,
} from '../../lib/blank/book';
import { applyQuotedText, quotedTerms, quotedText } from '../../lib/blank/material';
import { autoPickMore } from '../../lib/blank/pick';
import type { TermStat } from '../../lib/blank/quiz';

type Props = {
  book: BlankBook;
  others: BlankBook[];
  stats: Record<string, TermStat>;
  onChange: (book: BlankBook) => void;
  onMove: (from: BlankBook, to: BlankBook) => void;
  onNotice: (msg: string) => void;
};

export function Notes({ book, others, stats, onChange, onMove, onNotice }: Props) {
  const index = useMemo(() => buildIndex(book), [book]);
  const [focusPage, setFocusPage] = useState<string | null>(null);

  const setFolded = (folded: boolean) => onChange({ ...book, pages: book.pages.map((p) => ({ ...p, folded })) });

  return (
    <div className="notes">
      <div className="notes__tools">
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          title="AI가 아니라 규칙으로 — 되풀이되는 용어 · 괄호 짝 · 정의의 머리 · 로마자 용어"
          onClick={() => {
            const { book: next, added } = autoPickMore(book);
            onChange(next);
            onNotice(added > 0 ? `외울 낱말 ${added}개를 먼저 칠했어요 — 칠하기로 빼고 더해요` : '새로 고를 낱말이 없어요');
          }}
        >
          ✨ 자동으로 고르기
        </button>
        <span className="notes__spacer" />
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setFolded(true)}>
          모두 접기
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setFolded(false)}>
          모두 펼치기
        </button>
      </div>
      <p className="notes__hint">조사는 짐작으로 나눴어요 — 빈칸 끝이 틀렸으면 칠하기에서 그 낱말을 꾹 눌러 고쳐요.</p>

      {book.pages.length === 0 && (
        <div className="notes__empty">
          <p>이 학습주제에는 아직 필기가 없어요.</p>
          <p>외울 부분을 "큰따옴표"로 감싸거나 칠하기로 누르면 맞춰 보기에 나와요.</p>
        </div>
      )}

      {book.pages.map((page, i) => (
        <NoteCard
          key={page.id}
          book={book}
          index={index}
          pageIndex={i}
          stats={stats}
          others={others}
          autoFocusTitle={focusPage === page.id}
          onChange={onChange}
          onMove={(to) => {
            const [from, target] = movePage(book, i, to);
            onMove(from, target);
            onNotice(`“${page.title.trim() || '(제목 없음)'}” 주제를 ‘${to.title}’(으)로 옮겼어요`);
          }}
        />
      ))}

      <button
        type="button"
        className="notes__add"
        onClick={() => {
          const p = newPage();
          setFocusPage(p.id);
          onChange({ ...book, pages: [...book.pages, p] });
        }}
      >
        <PlusIcon size={16} /> 새 주제 추가
      </button>
    </div>
  );
}

function NoteCard({
  book,
  index,
  pageIndex,
  stats,
  others,
  autoFocusTitle,
  onChange,
  onMove,
}: {
  book: BlankBook;
  index: BookIndex;
  pageIndex: number;
  stats: Record<string, TermStat>;
  others: BlankBook[];
  autoFocusTitle: boolean;
  onChange: (book: BlankBook) => void;
  onMove: (to: BlankBook) => void;
}) {
  const page = book.pages[pageIndex]!;
  const fromBook = quotedText(index, pageIndex);
  const [draft, setDraft] = useState(fromBook);
  const [painting, setPainting] = useState(false);
  const [fix, setFix] = useState<BlankToken | null>(null);
  const editing = useRef(false);
  const timer = useRef(0);
  const live = useRef({ book, draft, pageIndex });
  live.current = { book, draft, pageIndex };

  // 칸을 치는 중이 아니면 책의 글을 따른다(칠하기 · 다른 카드가 바꾼 낱말).
  useEffect(() => {
    if (!editing.current) setDraft(fromBook);
  }, [fromBook]);

  const commit = () => {
    window.clearTimeout(timer.current);
    const { book: b, draft: d, pageIndex: p } = live.current;
    if (d === quotedText(buildIndex(b), p)) return;
    onChange(applyQuotedText(b, p, d));
  };

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const keys = new Set(index.spotsOn(pageIndex).map((s) => s.key));
  const chips = painting ? book.terms.filter((t) => keys.has(termKey(t.text))).map((t) => t.text) : quotedTerms(draft);

  return (
    <section className={`note${page.folded ? ' is-folded' : ''}`} aria-label={page.title || '제목 없는 주제'}>
      <div className="note__head">
        <button
          type="button"
          className="note__fold"
          aria-expanded={!page.folded}
          aria-label={page.folded ? '펼치기' : '접기'}
          onClick={() => onChange({ ...book, pages: book.pages.map((p, i) => (i === pageIndex ? { ...p, folded: !p.folded } : p)) })}
        >
          ▼
        </button>
        <input
          className="note__title"
          value={page.title}
          placeholder="제목 (주제)"
          aria-label="제목 (주제)"
          autoFocus={autoFocusTitle}
          onChange={(e) => onChange({ ...book, pages: book.pages.map((p, i) => (i === pageIndex ? { ...p, title: e.target.value } : p)) })}
        />
        {page.folded && <span className="note__count">외울 것 {keys.size}개</span>}
      </div>

      {!page.folded && (
        <>
          {painting ? (
            <PaintText index={index} pageIndex={pageIndex} stats={stats} onToggle={(b) => onChange(b)} onFix={setFix} />
          ) : (
            <textarea
              className="note__text"
              value={draft}
              placeholder={'내용 — 외울 부분은 "이렇게" 큰따옴표로 감싸기'}
              rows={Math.min(14, Math.max(4, draft.split('\n').length + Math.ceil(draft.length / 60)))}
              onFocus={() => {
                editing.current = true;
              }}
              onBlur={() => {
                editing.current = false;
                commit();
              }}
              onChange={(e) => {
                setDraft(e.target.value);
                window.clearTimeout(timer.current);
                timer.current = window.setTimeout(commit, 700);
              }}
            />
          )}
          <div className="note__chips">
            {chips.length === 0 ? (
              <span className="note__chips-empty">외울 낱말 없음</span>
            ) : (
              chips.map((c) => (
                <span key={termKey(c)} className="chip chip--action">
                  {c}
                </span>
              ))
            )}
          </div>
          <div className="note__actions">
            <button
              type="button"
              className={`pill-btn${painting ? ' is-on' : ''}`}
              aria-pressed={painting}
              onClick={() => {
                if (!painting) commit();
                setPainting((v) => !v);
              }}
            >
              🖍 칠하기
            </button>
            {painting && <span className="note__paint-hint">낱말을 눌러 칠하고 빼요 · 조사가 틀렸으면 꾹</span>}
            <span className="notes__spacer" />
            {others.length > 0 && (
              <label className="note__move">
                <span className="sr-only">다른 학습주제로 옮기기</span>
                <select
                  value=""
                  onChange={(e) => {
                    const to = others.find((o) => o.id === e.target.value);
                    if (to) onMove(to);
                  }}
                >
                  <option value="">📁 옮기기</option>
                  {others.map((o) => (
                    <option key={o.id} value={o.id}>
                      → {o.title}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button
              type="button"
              className="icon-btn icon-btn--sm icon-btn--danger"
              aria-label="주제 삭제"
              onClick={() => {
                if (page.text.trim() && !window.confirm(`“${page.title.trim() || '(제목 없음)'}” 주제를 삭제할까요?`)) return;
                onChange(removePage(book, pageIndex));
              }}
            >
              <TrashIcon size={15} />
            </button>
          </div>
        </>
      )}
      {fix && (
        <ParticleSheet
          book={book}
          index={index}
          token={fix}
          onClose={() => setFix(null)}
          onApply={(b) => {
            onChange(b);
            setFix(null);
          }}
        />
      )}
    </section>
  );
}

const HOLD_MS = 450;

/** 칠하기 — 어절을 눌러 외울 낱말로 켜고 끈다. 꾹 누르면 조사 고치기. 빛깔은 기록(안 푼 것 주황 · 맞힌 비율 50% 아래 붉게 · 85% 넘게 초록). */
function PaintText({
  index,
  pageIndex,
  stats,
  onToggle,
  onFix,
}: {
  index: BookIndex;
  pageIndex: number;
  stats: Record<string, TermStat>;
  onToggle: (book: BlankBook) => void;
  onFix: (token: BlankToken) => void;
}) {
  const text = index.book.pages[pageIndex]!.text;
  const toks = index.tokens[pageIndex] ?? [];
  const spots = index.spotsOn(pageIndex);
  const hold = useRef<{ timer: number; fired: boolean } | null>(null);

  const spotAt = (tok: BlankToken) => spots.find((s) => s.start <= tok.start && tok.end <= s.tailEnd);
  const tone = (key: string) => {
    const s = stats[key];
    if (!s || s.seen === 0) return 'new';
    const r = s.right / s.seen;
    return r < 0.5 ? 'weak' : r > 0.85 ? 'strong' : 'mid';
  };

  const toggle = (tok: BlankToken) => {
    const spot = spotAt(tok);
    const book = index.book;
    if (spot) {
      onToggle({ ...book, terms: book.terms.filter((t) => termKey(t.text) !== spot.key) });
      return;
    }
    const stem = index.split(tok.text).stem;
    if (!termKey(stem)) return;
    onToggle(hasTerm(book, termKey(stem)) ? book : toggleTerm(book, stem));
  };

  if (!text.trim()) return <p className="note__paint note__paint--empty">칠할 글이 없어요 — 칠하기를 끄고 내용을 적어요.</p>;

  const out: React.ReactNode[] = [];
  let at = 0;
  toks.forEach((tok, i) => {
    out.push(text.slice(at, tok.start));
    const spot = spotAt(tok);
    const stemEnd = spot ? Math.min(tok.end, spot.end) : tok.start;
    out.push(
      <span
        key={i}
        role="button"
        tabIndex={0}
        className={`paint-w${spot ? ` is-term tone-${tone(spot.key)}` : ''}`}
        onPointerDown={() => {
          const h = { timer: 0, fired: false };
          h.timer = window.setTimeout(() => {
            h.fired = true;
            onFix(tok);
          }, HOLD_MS);
          hold.current = h;
        }}
        onPointerUp={() => {
          const h = hold.current;
          hold.current = null;
          if (!h) return;
          window.clearTimeout(h.timer);
          if (!h.fired) toggle(tok);
        }}
        onPointerLeave={() => {
          if (hold.current) window.clearTimeout(hold.current.timer);
          hold.current = null;
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          onFix(tok);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (e.shiftKey) onFix(tok);
            else toggle(tok);
          }
        }}
      >
        {spot ? (
          <>
            <mark>{text.slice(tok.start, stemEnd)}</mark>
            {text.slice(stemEnd, tok.end)}
          </>
        ) : (
          tok.text
        )}
      </span>,
    );
    at = tok.end;
  });
  out.push(text.slice(at));
  return <p className="note__paint">{out}</p>;
}

/** 조사 고치기 — 글자 사이를 눌러 낱말이 끝나는 자리를 고른다(사람의 결정 'manual' — 짐작보다 앞선다). */
function ParticleSheet({
  book,
  index,
  token,
  onClose,
  onApply,
}: {
  book: BlankBook;
  index: BookIndex;
  token: BlankToken;
  onClose: () => void;
  onApply: (book: BlankBook) => void;
}) {
  const chars = [...token.text];
  const guess = index.split(token.text);
  const [n, setN] = useState([...guess.stem].length);
  const decided = book.splits[token.text];
  const stemNow = chars.slice(0, n).join('');
  const [on, setOn] = useState(hasTerm(book, termKey(guess.stem)));

  return (
    <Dialog title="어디까지가 낱말인가요?" onClose={onClose}>
      <p className="psheet__by">
        글자 사이를 눌러 낱말이 끝나는 자리를 골라요 ·{' '}
        {decided?.by === 'manual' ? '직접 고친 자리' : decided?.by === 'quote' ? '따옴표가 정한 자리' : '짐작한 자리'}
      </p>
      <div className="psheet__word" role="group" aria-label="낱말이 끝나는 자리">
        {chars.map((c, i) => (
          <span key={i} className="psheet__cell">
            <span className={i < n ? 'is-stem' : 'is-tail'}>{c}</span>
            {i < chars.length - 1 && (
              <button
                type="button"
                className={`psheet__gap${i + 1 === n ? ' is-on' : ''}`}
                aria-label={`${chars.slice(0, i + 1).join('')}까지 낱말`}
                onClick={() => setN(i + 1)}
              />
            )}
          </span>
        ))}
      </div>
      <p className="psheet__answer">
        답: <b>{stemNow}</b>
        {n < chars.length && <> + 조사 {chars.slice(n).join('')}</>}
      </p>
      <div className="psheet__row">
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setN(chars.length)}>
          조사 없음
        </button>
        <label className="bq__toggle">
          <input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} /> 외울 낱말
        </label>
      </div>
      <div className="psheet__actions">
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            let next = followSplits(book, { ...book.splits, [token.text]: { n: stemNow.length, by: 'manual' } });
            const key = termKey(stemNow);
            if (on && !hasTerm(next, key)) next = toggleTerm(next, stemNow);
            if (!on && hasTerm(next, key)) next = toggleTerm(next, stemNow);
            onApply(next);
          }}
        >
          이렇게 할게요
        </button>
      </div>
    </Dialog>
  );
}

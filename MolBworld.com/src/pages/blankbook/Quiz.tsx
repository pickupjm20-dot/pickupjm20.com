/**
 * 맞춰 보기 — 원본 '과연 내가 외웠을까?'의 흐름(앱 블랭크북 6절): 위에 '진행 n/m · 맞음 · 틀림'과 '띄어쓰기 무시', 카드에 '주제' · 카드 제목 ·
 * 글(빈칸 ?), 큰 입력칸(Enter), [모르겠어요] [확인]. 내면 '정답! 외웠네요 👏' / '아쉬워요' / '정답 확인', 틀렸으면 정답 · 내 답의 글자 차이,
 * 'n초 · n타/분', [다음 문제 (Enter)]. 다 풀면 '모든 문제를 다 풀었어요! 🎉' · 처음부터 다시 풀기 · 틀린 n개만 다시.
 *
 * 바퀴(Round)는 책마다 부모가 쥔다 — 개념 필기로 갔다 와도 이어진다. 화면이 치워질 때 아직 안 적은 답이 있으면 타자 판 한 줄을 적는다.
 */
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { ReviewOffBadge } from '../../components/ReviewOffBadge';
import { buildIndex, newId, pageLabel, type BlankBook, type BookIndex } from '../../lib/blank/book';
import { neutralParticle } from '../../lib/blank/josa';
import { charDiff, isCorrectAnswer, maskedIn, pickQuestion, quizPageIds, quizRange, tidyAnswer, type BlankItem, type TermStat } from '../../lib/blank/quiz';
import { cpmOf, keystrokes, measurable, typingStats, type TypingRound, type TypingStats } from '../../lib/blank/typing';
import { RoundEnd } from './Typing';

export type Answer = { item: BlankItem; typed: string; correct: boolean; gaveUp: boolean; responseMs: number; typingMs: number; keys: number };

export type Round = {
  id: string;
  only: Set<string> | null;
  used: Set<string>;
  answers: Answer[];
  /** 타자 판 줄로 이미 적은 답 수. */
  written: number;
  current: BlankItem | null;
  finished: { row: TypingRound | null; before: TypingStats; after: TypingStats } | null;
};

export const newRound = (only: Set<string> | null = null): Round => ({
  id: newId('round'),
  only,
  used: new Set(),
  answers: [],
  written: 0,
  current: null,
  finished: null,
});

/** 아직 안 적은 답들의 타자 판 줄 — 없으면 null. 맞힌 답 가운데 잴 만한 것만 타수에 든다. */
export function takeRow(round: Round, bookId: string): TypingRound | null {
  const rest = round.answers.slice(round.written);
  if (rest.length === 0) return null;
  round.written = round.answers.length;
  let measured = 0;
  let keys = 0;
  let typingMs = 0;
  for (const a of rest) {
    if (!measurable(a.correct, a.keys, a.typingMs)) continue;
    measured++;
    keys += a.keys;
    typingMs += a.typingMs;
  }
  return { id: newId('round'), bookId, at: Date.now(), answers: rest.length, correct: rest.filter((a) => a.correct).length, measured, keys, typingMs };
}

type Props = {
  book: BlankBook;
  stats: Record<string, TermStat>;
  rounds: TypingRound[];
  round: Round;
  ignoreSpace: boolean;
  onIgnoreSpace: (v: boolean) => void;
  onAnswer: (key: string, correct: boolean) => void;
  onRow: (row: TypingRound) => void;
  onRestart: (only: Set<string> | null) => void;
  onGoNotes: () => void;
};

export function Quiz({ book, stats, rounds, round, ignoreSpace, onIgnoreSpace, onAnswer, onRow, onRestart, onGoNotes }: Props) {
  const index = useMemo(() => buildIndex(book), [book]);
  const [, bump] = useState(0);
  const [typed, setTyped] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const shownAt = useRef(Date.now());
  const firstKeyAt = useRef<number | null>(null);
  const checkedAt = useRef(0);
  const live = useRef({ round, onRow, bookId: book.id });
  live.current = { round, onRow, bookId: book.id };

  const pool = quizPageIds(index).filter((id) => !round.only || round.only.has(id));
  const done = pool.filter((id) => round.used.has(id)).length;
  const ok = round.answers.filter((a) => a.correct).length;
  const bad = round.answers.length - ok;
  const last = round.answers[round.answers.length - 1];
  const showing = last && round.current && last.item === round.current ? last : null;

  // 다음 문제를 세운다 — 지금 문제가 없거나, 지금 문제의 쪽이 책에서 사라졌으면.
  useEffect(() => {
    if (round.finished) return;
    const stale = round.current && !book.pages.some((p) => p.id === round.current!.pageId);
    if (round.current && !stale) return;
    const next = pickQuestion(index, stats, round.used, round.only);
    round.current = next;
    if (!next && round.answers.length > 0) {
      const before = typingStats(rounds);
      const row = takeRow(round, book.id);
      const after = typingStats(row ? [...rounds, row] : rounds);
      round.finished = { row, before, after };
      if (row) onRow(row);
    }
    shownAt.current = Date.now();
    firstKeyAt.current = null;
    setTyped('');
    bump((n) => n + 1);
    // 바퀴는 부모가 쥔 변하는 상자라, 그 칸(current · finished)이 바뀐 것을 deps로 본다.
  }, [index, round, round.current, round.finished]);

  // 화면이 치워질 때 — 푼 것이 있으면 판 줄로.
  useEffect(
    () => () => {
      const { round: r, onRow: write, bookId } = live.current;
      const row = takeRow(r, bookId);
      if (row) write(row);
    },
    [],
  );

  useEffect(() => {
    if (round.current && !showing) input.current?.focus({ preventScroll: true });
  }, [round.current, showing]);

  const submit = (gaveUp: boolean) => {
    const item = round.current;
    if (!item || showing) return;
    const now = Date.now();
    const text = gaveUp ? '' : typed;
    const correct = !gaveUp && isCorrectAnswer(text, item, ignoreSpace);
    round.answers.push({
      item,
      typed: text,
      correct,
      gaveUp,
      responseMs: now - shownAt.current,
      typingMs: firstKeyAt.current != null && !gaveUp ? now - firstKeyAt.current : 0,
      keys: gaveUp ? 0 : keystrokes(text),
    });
    round.used.add(item.pageId);
    checkedAt.current = now;
    onAnswer(item.spot.key, correct);
    bump((n) => n + 1);
    // 입력칸은 문제 내내 켜 둔다(원본) — '모르겠어요'를 눌러도 Enter로 다음에 가게. 폰 자판도 안 내려간다.
    requestAnimationFrame(() => input.current?.focus({ preventScroll: true }));
  };

  const next = () => {
    if (Date.now() - checkedAt.current < 250) return; // 한글 입력기의 겹친 Enter
    round.current = null;
    bump((n) => n + 1);
  };

  if (pool.length === 0 && !round.finished) {
    return (
      <div className="bq bq--empty">
        <p>
          이 학습주제에는 아직 맞춰 볼 내용이 없어요.
          <br />
          개념 필기의 내용에서 외울 부분을 <b>"큰따옴표"</b>로 감싸 주세요.
          <br />
          (카드의 칠하기로 눌러 골라도 돼요)
        </p>
        <button type="button" className="btn btn--primary" onClick={onGoNotes}>
          개념 필기로
        </button>
      </div>
    );
  }

  if (round.finished) {
    const wrong = [...new Set(round.answers.filter((a) => !a.correct).map((a) => a.item.pageId))];
    return (
      <div className="bq bq--done">
        <p className="bq__done-title">모든 문제를 다 풀었어요! 🎉</p>
        <p className="bq__done-sub">
          {round.answers.length}문제 중 맞음 <b className="ok">{ok}</b> · 틀림 <b className="bad">{bad}</b>
        </p>
        <RoundEnd row={round.finished.row} before={round.finished.before} after={round.finished.after} />
        <div className="bq__actions">
          <button type="button" className="btn btn--primary" onClick={() => onRestart(null)}>
            처음부터 다시 풀기
          </button>
          {wrong.length > 0 && (
            <button type="button" className="btn btn--outline" onClick={() => onRestart(new Set(wrong))}>
              틀린 {wrong.length}개만 다시
            </button>
          )}
        </div>
        <p className="bq__note">
          <ReviewOffBadge /> 사이트판은 안 푼 것 · 지난번에 틀린 것을 먼저 낼 뿐, 다음 복습일은 정하지 않아요.
        </p>
      </div>
    );
  }

  const item = round.current;
  return (
    <div className="bq">
      <div className="bq__bar">
        <span>
          진행 <b>{Math.min(done + (showing ? 0 : 1), pool.length)}</b>/{pool.length} · 맞음 <b className="ok">{ok}</b> · 틀림{' '}
          <b className="bad">{bad}</b>
        </span>
        <label className="bq__toggle">
          <input type="checkbox" checked={ignoreSpace} onChange={(e) => onIgnoreSpace(e.target.checked)} /> 띄어쓰기 무시
        </label>
      </div>
      {item && (
        <>
          <article className="bq__card">
            <p className="bq__topic">주제</p>
            <h3 className="bq__title">{pageLabel(book.pages[item.spot.page]!)}</h3>
            <QuestionText index={index} item={item} answered={showing} />
          </article>
          <form
            className="bq__form"
            onSubmit={(e) => {
              e.preventDefault();
              if (showing) next();
              else submit(false);
            }}
          >
            <label className="sr-only" htmlFor="bq-input">
              빈칸에 들어갈 말
            </label>
            <input
              id="bq-input"
              ref={input}
              className="field bq__input"
              value={typed}
              placeholder="빈칸에 들어갈 내용을 입력하고 Enter"
              autoComplete="off"
              spellCheck={false}
              // 폰 자판 — Enter 자리에 '완료/다음'이 서고, 영어 답의 첫 글자를 대문자로 · 낱말을 고쳐 쓰지 않게(답이 바뀐다).
              enterKeyHint={showing ? 'next' : 'done'}
              autoCapitalize="off"
              autoCorrect="off"
              onChange={(e) => {
                if (showing) return;
                if (firstKeyAt.current == null && e.target.value) firstKeyAt.current = Date.now();
                setTyped(e.target.value);
              }}
            />
            {showing ? (
              <button type="submit" className="btn btn--primary">
                {done >= pool.length ? '결과 보기 (Enter)' : '다음 문제 (Enter)'}
              </button>
            ) : (
              <>
                <button type="button" className="btn btn--ghost" onClick={() => submit(true)}>
                  모르겠어요
                </button>
                <button type="submit" className="btn btn--primary">
                  확인
                </button>
              </>
            )}
          </form>
          {showing && <Feedback answer={showing} />}
        </>
      )}
    </div>
  );
}

/** 문제의 글 — 빈칸은 '?' 상자와 두 꼴 조사, 같은 낱말의 다른 자리는 밑줄로 가리고, 다른 외울 낱말은 "따옴표"째. */
function QuestionText({ index, item, answered }: { index: BookIndex; item: BlankItem; answered: Answer | null }) {
  const text = index.book.pages[item.spot.page]!.text;
  const [from, to] = quizRange(text, item.spot);
  const masked = new Set(maskedIn(index, item, [from, to]).map((s) => s.start));
  const others = index.spotsOn(item.spot.page).filter((s) => s.start >= from && s.end <= to && s.start !== item.spot.start && !masked.has(s.start));
  const marks = [
    { start: item.spot.start, end: item.spot.tailEnd, kind: 'target' as const, spot: item.spot },
    ...index.spotsOn(item.spot.page).filter((s) => masked.has(s.start)).map((s) => ({ start: s.start, end: s.end, kind: 'mask' as const, spot: s })),
    ...others.map((s) => ({ start: s.start, end: s.end, kind: 'quote' as const, spot: s })),
  ].sort((a, b) => a.start - b.start);

  const pieces: React.ReactNode[] = [];
  let at = from;
  marks.forEach((m, i) => {
    if (m.start < at) return;
    pieces.push(<Fragment key={`t${i}`}>{text.slice(at, m.start)}</Fragment>);
    if (m.kind === 'target') {
      const particle = text.slice(item.spot.end, item.spot.tailEnd);
      pieces.push(
        <span key={`m${i}`} className="bq__blank-wrap">
          {answered ? (
            <span className={`bq__reveal ${answered.correct ? 'ok' : 'bad'}`}>{item.answer}</span>
          ) : (
            <span className="bq__blank" aria-label="빈칸">
              ?
            </span>
          )}
          {answered ? particle : neutralParticle(particle)}
        </span>,
      );
    } else if (m.kind === 'mask') {
      pieces.push(
        <span key={`m${i}`} className="bq__mask" aria-label="가린 낱말">
          {'＿'.repeat(Math.min(6, Math.max(2, m.end - m.start)))}
        </span>,
      );
    } else {
      pieces.push(<Fragment key={`m${i}`}>"{text.slice(m.start, m.end)}"</Fragment>);
    }
    at = m.end;
  });
  pieces.push(<Fragment key="end">{text.slice(at, to)}</Fragment>);
  return (
    <p className="bq__text">
      {from > 0 && '… '}
      {pieces}
      {to < text.length && ' …'}
    </p>
  );
}

function Feedback({ answer }: { answer: Answer }) {
  const sec = Math.max(0.5, answer.responseMs / 1000);
  const cpm = measurable(answer.correct, answer.keys, answer.typingMs) ? cpmOf(answer.keys, answer.typingMs) : null;
  const title = answer.correct ? '정답! 외웠네요 👏' : answer.gaveUp ? '정답 확인' : '아쉬워요';
  const diff = !answer.correct && answer.typed.trim() ? charDiff(tidyAnswer(answer.item.answer), tidyAnswer(answer.typed)) : null;
  return (
    <div className={`bq__fb ${answer.correct ? 'is-ok' : 'is-bad'}`} role="status">
      <p className="bq__fb-title">{title}</p>
      {!answer.correct && (
        <dl className="bq__diff">
          <div>
            <dt>정답</dt>
            <dd>
              {diff
                ? diff.answer.map(([c, same], i) => (
                    <span key={i} className={same ? '' : 'miss'}>
                      {c}
                    </span>
                  ))
                : answer.item.answer}
            </dd>
          </div>
          {diff && (
            <div>
              <dt>내 답</dt>
              <dd>
                {diff.typed.map(([c, same], i) => (
                  <span key={i} className={same ? '' : 'extra'}>
                    {c}
                  </span>
                ))}
              </dd>
            </div>
          )}
        </dl>
      )}
      <p className="bq__fb-meta">
        {sec.toFixed(1)}초 · {cpm == null ? '—' : Math.round(cpm)}타/분
      </p>
    </div>
  );
}

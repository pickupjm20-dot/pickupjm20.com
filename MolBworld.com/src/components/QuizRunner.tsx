/**
 * 뜻 적기 퀴즈 — 앱의 복습 퀴즈처럼 낱말을 보고 뜻을 적는다. 찍먹의 '공부 끝!'과 블랭크북의 단어장이 같이 쓴다.
 *
 * 순서는 무작위다. 앱은 FSRS-6가 '오늘 볼 낱말'을 고르고 결과로 다음 날짜를 다시 셈하지만, 사이트는 맞힌 · 틀린
 * 횟수만 넘긴다([onResult]) — 그래서 이 판에도 '복습 알고리즘 꺼짐'이 붙는다.
 */
import { useEffect, useRef, useState } from 'react';
import { gradeMeaning, shuffle } from '../lib/quiz';
import { CheckIcon, CloseIcon } from './Icons';
import { ReviewOffBadge } from './ReviewOffBadge';

export type QuizItem = { id: string; word: string; meaning: string; sentence: string };

type Answer = { id: string; given: string; correct: boolean };

export function QuizRunner({
  items,
  onResult,
  onClose,
  title = '뜻 적기',
}: {
  items: QuizItem[];
  onResult?: (id: string, correct: boolean) => void;
  onClose?: () => void;
  title?: string;
}) {
  // 시작할 때 한 번 섞어 붙든다 — 풀다가 부모가 다시 그려져도 순서가 바뀌지 않게.
  const [order, setOrder] = useState(() => shuffle(items.filter((i) => i.meaning.trim())));
  const [at, setAt] = useState(0);
  const [given, setGiven] = useState('');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [hint, setHint] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const item = order[at];
  const checked = answers.length > at;
  const last = answers[at];

  useEffect(() => {
    if (!checked) input.current?.focus();
  }, [at, checked]);

  if (order.length === 0) {
    return (
      <div className="quiz quiz--empty">
        <p>뜻이 적힌 낱말이 없어요. 낱말을 담고 뜻을 적어 두면 퀴즈가 생겨요.</p>
        {onClose && (
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            닫기
          </button>
        )}
      </div>
    );
  }

  const check = () => {
    if (!item || checked) return;
    const correct = gradeMeaning(given, item.meaning);
    setAnswers((a) => [...a, { id: item.id, given, correct }]);
    onResult?.(item.id, correct);
  };

  const overrule = () => {
    if (!item || !last || last.correct) return;
    setAnswers((a) => a.map((x, i) => (i === at ? { ...x, correct: true } : x)));
    // 틀림으로 한 번 센 것을 맞음으로 바로잡는다 — 틀림 −1은 하지 않고 맞음만 더한다(기록은 너그럽게).
    onResult?.(item.id, true);
  };

  const next = () => {
    setGiven('');
    setHint(false);
    setAt((n) => n + 1);
  };

  const restart = () => {
    setAnswers([]);
    setAt(0);
    setGiven('');
    setHint(false);
    setOrder(shuffle(items.filter((i) => i.meaning.trim())));
  };

  if (!item) {
    const right = answers.filter((a) => a.correct).length;
    const wrong = answers.filter((a) => !a.correct);
    return (
      <div className="quiz quiz--done">
        <div className="quiz__head">
          <span className="quiz__title">{title} 끝!</span>
          <ReviewOffBadge align="right" />
        </div>
        <p className="quiz__score">
          <strong>{right}</strong> / {answers.length} 맞혔어요
        </p>
        {wrong.length > 0 && (
          <ul className="quiz__wrong">
            {wrong.map((w) => {
              const it = order.find((o) => o.id === w.id);
              return (
                <li key={w.id}>
                  <b>{it?.word}</b> {it?.meaning}
                  {w.given && <span className="quiz__given"> · 내가 적은 뜻 “{w.given}”</span>}
                </li>
              );
            })}
          </ul>
        )}
        <p className="quiz__note">앱이라면 이 결과로 낱말마다 다음 복습일이 정해져요. 여기서는 맞힌 횟수만 남겨요.</p>
        <div className="quiz__actions">
          <button type="button" className="btn btn--primary" onClick={restart}>
            다시 풀기
          </button>
          {onClose && (
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              닫기
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="quiz">
      <div className="quiz__head">
        <span className="quiz__title">{title}</span>
        <span className="quiz__progress" aria-label={`${order.length}문제 가운데 ${at + 1}번째`}>
          {at + 1} / {order.length}
        </span>
        <ReviewOffBadge align="right" />
        {onClose && (
          <button type="button" className="icon-btn icon-btn--sm" aria-label="퀴즈 닫기" onClick={onClose}>
            <CloseIcon size={16} />
          </button>
        )}
      </div>
      <div className="quiz__bar" aria-hidden="true">
        <span style={{ width: `${(at / order.length) * 100}%` }} />
      </div>
      <p className="quiz__word">{item.word}</p>
      {item.sentence &&
        (hint ? (
          <p className="quiz__hint">{item.sentence}</p>
        ) : (
          <button type="button" className="link-btn" onClick={() => setHint(true)}>
            담은 문장 보기
          </button>
        ))}
      <form
        className="quiz__form"
        onSubmit={(e) => {
          e.preventDefault();
          if (checked) next();
          else check();
        }}
      >
        <label className="sr-only" htmlFor="quiz-answer">
          {item.word}의 뜻
        </label>
        <input
          id="quiz-answer"
          ref={input}
          className="field"
          value={given}
          onChange={(e) => setGiven(e.target.value)}
          placeholder="뜻을 한국어로 적어요"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint={checked ? 'next' : 'done'}
          autoCapitalize="off"
          autoCorrect="off"
          readOnly={checked}
        />
        <button type="submit" className="btn btn--primary">
          {checked ? '다음' : '확인'}
        </button>
      </form>
      {checked && last && (
        <div className={`quiz__feedback ${last.correct ? 'is-right' : 'is-wrong'}`} role="status">
          {last.correct ? <CheckIcon size={18} /> : <CloseIcon size={18} />}
          <span>
            {last.correct ? '맞았어요!' : given.trim() ? '아쉬워요.' : '건너뛰었어요.'} 뜻: <b>{item.meaning}</b>
          </span>
          {!last.correct && given.trim() && (
            <button type="button" className="link-btn" onClick={overrule}>
              맞은 걸로 할래요
            </button>
          )}
        </div>
      )}
    </div>
  );
}

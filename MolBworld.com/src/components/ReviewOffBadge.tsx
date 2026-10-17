/**
 * '복습 알고리즘 꺼짐' — 작게, 그러나 단어를 담고 푸는 자리마다.
 *
 * 앱의 단어장은 FSRS-6로 낱말마다 다음 복습일을 정하고, 복습할수록 본문의 형광펜이 옅어진다. 사이트는 담고 · 적고 ·
 * 풀어 보기까지만 하고 일정은 잡지 않는다 — 사용자가 사이트에서 모은 단어가 '알아서 복습될 것'이라 믿지 않게.
 */
import { useEffect, useId, useRef, useState } from 'react';

export function ReviewOffBadge({ align = 'left' }: { align?: 'left' | 'right' }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('pointerdown', close);
    window.addEventListener('keydown', close);
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <span className="review-off" ref={ref}>
      <button
        type="button"
        className="review-off__pill"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="review-off__dot" aria-hidden="true" />
        복습 알고리즘 꺼짐
      </button>
      {open && (
        <span id={id} role="note" className={`review-off__pop review-off__pop--${align}`}>
          <strong>사이트판은 복습 일정을 잡지 않아요.</strong>
          앱의 단어장은 FSRS-6로 낱말마다 다음 복습일을 정하고, 복습할수록 형광펜이 옅어져요. 여기서는 담기 · 뜻 적기 ·
          맞힌 횟수까지만 기록하고, 퀴즈 순서는 무작위예요.
        </span>
      )}
    </span>
  );
}

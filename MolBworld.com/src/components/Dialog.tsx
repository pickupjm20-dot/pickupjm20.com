/** 아래에서 올라오는 시트 — 블랭크북의 새 학습주제 · 내 타자 · 조사 고치기. Esc · 바깥 누르기로 닫고, 닫으면 연 단추로 초점을 돌려준다. */
import { useEffect, useRef, type ReactNode } from 'react';
import { CloseIcon } from './Icons';

export function Dialog({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const first = panel.current?.querySelector<HTMLElement>('input, textarea, button:not(.sheet__close), [href]');
    (first ?? panel.current)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.classList.add('no-scroll');
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.classList.remove('no-scroll');
      opener?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="sheet" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={panel} className={`sheet__panel${wide ? ' sheet__panel--wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}>
        <div className="sheet__head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn sheet__close" aria-label="닫기" onClick={onClose}>
            <CloseIcon size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

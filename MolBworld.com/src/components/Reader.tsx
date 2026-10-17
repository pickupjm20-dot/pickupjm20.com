/**
 * MolB 리더 — 찍먹 지문과 블랭크북이 같이 쓴다.
 *
 * 앱과 같은 손짓: 모르는 낱말은 **톡**(눌러서 담기 — 형광펜이 남는다), 아는데 헷갈리는 낱말은 **꾹**(길게 눌러서
 * 보기만 — 단어장에 안 담긴다). 마우스도 같다(누르고 있으면 꾹). 키보드는 본문에 들어와 ← → 로 낱말을 옮기고
 * Enter가 톡, Shift+Enter가 꾹.
 *
 * 낱말마다 손잡이를 다는 대신 본문 한 곳에서 받는다(data-s · data-t) — 블랭크북의 긴 글에서도 가볍게.
 */
import { Fragment, useCallback, useMemo, useRef, type ReactNode } from 'react';
import type { Doc, Paragraph, Sentence, Token } from '../lib/text';

export type WordHit = { sentence: Sentence; tokenIndex: number; token: Token };
export type WordState = 'marked' | 'peeked' | null;
export type Spot = { s: number; t: number };

const HOLD_MS = 450;
const MOVE_CANCEL_PX = 10;

type Props = {
  doc: Doc;
  wordState: (token: Token, sentence: Sentence, tokenIndex: number) => WordState;
  active: Spot | null;
  onTap: (hit: WordHit) => void;
  onPeek: (hit: WordHit) => void;
  translationFor?: (paragraph: Paragraph) => string | null;
  showTranslation?: boolean;
  /** 첫 문단 뒤에 놓을 것(지문의 그림). */
  figure?: ReactNode;
  label: string;
};

export function Reader({ doc, wordState, active, onTap, onPeek, translationFor, showTranslation, figure, label }: Props) {
  const sentences = useMemo(() => doc.paragraphs.flatMap((p) => p.sentences), [doc]);
  const press = useRef<{ s: number; t: number; x: number; y: number; fired: boolean; timer: number } | null>(null);
  const root = useRef<HTMLDivElement>(null);

  const hitAt = useCallback(
    (s: number, t: number): WordHit | null => {
      const sentence = sentences[s];
      const token = sentence?.tokens[t];
      return sentence && token?.word ? { sentence, tokenIndex: t, token } : null;
    },
    [sentences],
  );

  const spotOf = (target: EventTarget | null): Spot | null => {
    const el = (target as HTMLElement | null)?.closest?.('[data-t]') as HTMLElement | null;
    if (!el) return null;
    return { s: Number(el.dataset.s), t: Number(el.dataset.t) };
  };

  const cancel = () => {
    if (press.current) window.clearTimeout(press.current.timer);
    press.current = null;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const spot = spotOf(e.target);
    if (!spot) return;
    cancel();
    const p = { ...spot, x: e.clientX, y: e.clientY, fired: false, timer: 0 };
    p.timer = window.setTimeout(() => {
      p.fired = true;
      const hit = hitAt(p.s, p.t);
      if (hit) {
        onPeek(hit);
        navigator.vibrate?.(8);
      }
    }, HOLD_MS);
    press.current = p;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const p = press.current;
    if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) > MOVE_CANCEL_PX) cancel();
  };

  const onPointerUp = () => {
    const p = press.current;
    if (!p) return;
    window.clearTimeout(p.timer);
    press.current = null;
    if (p.fired) return;
    const hit = hitAt(p.s, p.t);
    if (hit) onTap(hit);
  };

  // 키보드 — 본문에 들어오면 지금 고른 낱말(없으면 첫 낱말)로, 화살표로 옮긴다.
  const words = useMemo(() => {
    const out: Spot[] = [];
    sentences.forEach((s, si) => s.tokens.forEach((t, ti) => t.word && out.push({ s: si, t: ti })));
    return out;
  }, [sentences]);

  const focusSpot = (spot: Spot | undefined) => {
    if (!spot) return;
    root.current?.querySelector<HTMLElement>(`[data-s="${spot.s}"][data-t="${spot.t}"]`)?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const here = spotOf(document.activeElement);
    if (e.target === root.current && (e.key === 'Enter' || e.key.startsWith('Arrow'))) {
      e.preventDefault();
      focusSpot(active ?? words[0]);
      return;
    }
    if (!here) return;
    const i = words.findIndex((w) => w.s === here.s && w.t === here.t);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      focusSpot(words[Math.min(words.length - 1, i + (e.key === 'ArrowDown' ? 8 : 1))]);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      focusSpot(words[Math.max(0, i - (e.key === 'ArrowUp' ? 8 : 1))]);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const hit = hitAt(here.s, here.t);
      if (hit) (e.shiftKey ? onPeek : onTap)(hit);
    }
  };

  return (
    <div
      ref={root}
      className="reader"
      role="group"
      aria-label={`${label} — 낱말을 눌러 담고, 길게 눌러 보기만 해요. 키보드는 화살표로 옮기고 Enter로 담기, Shift+Enter로 보기만.`}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={cancel}
      onPointerLeave={cancel}
      onContextMenu={(e) => {
        if (spotOf(e.target)) e.preventDefault();
      }}
      onKeyDown={onKeyDown}
    >
      {doc.paragraphs.map((p, pi) => {
        const tr = showTranslation && translationFor ? translationFor(p) : null;
        return (
          <Fragment key={pi}>
            <p className="reader__para">
              {p.sentences.map((s, k) => (
                <Fragment key={s.index}>
                  {k > 0 && ' '}
                  {s.tokens.map((tok, ti) => {
                    if (!tok.word) return <Fragment key={ti}>{tok.text}</Fragment>;
                    const state = wordState(tok, s, ti);
                    const isActive = active?.s === s.index && active?.t === ti;
                    return (
                      <span
                        key={ti}
                        className={`w${state ? ` is-${state}` : ''}${isActive ? ' is-active' : ''}`}
                        data-s={s.index}
                        data-t={ti}
                        tabIndex={-1}
                      >
                        {tok.text}
                      </span>
                    );
                  })}
                </Fragment>
              ))}
            </p>
            {tr && <p className="reader__tr">{tr}</p>}
            {pi === 0 && figure}
          </Fragment>
        );
      })}
    </div>
  );
}

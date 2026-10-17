/**
 * 스크롤로 들어올 때 살짝 떠오르기 — `data-reveal`이 붙은 것들. 움직임 줄이기를 켠 사람에게는 처음부터 보인다
 * (CSS가 처리한다). 쪽이 바뀌면 새로 찾는다.
 */
import { useEffect } from 'react';

export function useReveal(dep: unknown) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-in)'));
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [dep]);
}

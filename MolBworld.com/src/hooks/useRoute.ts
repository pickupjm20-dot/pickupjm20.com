/**
 * 해시 라우터 — `#/blankbook`은 블랭크북 쪽(`#/blankbook/<책>` · `#/blankbook/<책>/quiz` · `#/blankbook/sample/<예시>`),
 * `#/taste` · `#/world` 같은 나머지는 홈의 그 절.
 *
 * 해시를 쓰는 까닭: 사이트가 `pickupjm20.com/MolBworld.com/` 같은 하위 경로 · 정적 호스팅(GitHub Pages)에
 * 올라가도 새로고침 · 링크 공유가 404 없이 돈다. 라우터 라이브러리를 들일 만큼 쪽이 많지 않다.
 */
import { useEffect, useState } from 'react';

export type Route = { page: 'home' | 'blankbook'; section: string | null; rest: string[] };

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#\/?/, '').split(/[?#]/)[0] ?? '';
  const [head, ...rest] = path.split('/').filter(Boolean).map((p) => decodeURIComponent(p));
  if (head === 'blankbook') return { page: 'blankbook', section: null, rest };
  return { page: 'home', section: head || null, rest: [] };
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const on = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/** 홈의 절로 — 해시를 바꾸고(같은 해시여도) 그 절로 굴러간다. */
export function goToSection(section: string) {
  const target = `#/${section}`;
  if (window.location.hash !== target) {
    window.location.hash = target;
  }
  scrollToSection(section);
}

export function scrollToSection(section: string) {
  requestAnimationFrame(() => {
    const el = document.getElementById(section);
    if (!el) return;
    el.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
  });
}

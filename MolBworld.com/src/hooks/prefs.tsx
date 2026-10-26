/**
 * 사이트 전체의 취향 — 고른 캐릭터와 낮 · 밤 테마. 앱이 다섯 캐릭터 가운데 하나를 '몰비'로 고르게 하듯, 사이트도
 * 고른 캐릭터가 히어로 · 찍먹 · 블랭크북에 선다. 둘 다 이 브라우저에만 저장한다.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CHARACTERS, type CharacterId } from '../data/site';
import { usePersistentState } from '../lib/storage';

export type Theme = 'light' | 'dark';

type Prefs = {
  character: CharacterId;
  setCharacter: (c: CharacterId) => void;
  theme: Theme;
  toggleTheme: () => void;
};

const PrefsContext = createContext<Prefs | null>(null);

const isCharacter = (v: unknown): v is CharacterId => CHARACTERS.some((c) => c.id === v);

const darkQuery = () => window.matchMedia?.('(prefers-color-scheme: dark)');

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [character, setCharacter] = usePersistentState<CharacterId>('character', 'squirrel', (v) =>
    isCharacter(v) ? v : 'squirrel',
  );
  // 고른 적이 없으면(null) 기기의 설정을 따른다 — index.html의 첫 스크립트와 같은 규칙.
  const [chosen, setChosen] = usePersistentState<Theme | null>('theme', null, (v) =>
    v === 'light' || v === 'dark' ? v : null,
  );
  const [system, setSystem] = useState<Theme>(() => (darkQuery()?.matches ? 'dark' : 'light'));
  // 고른 적이 없으면 뿌리에 이미 선 값(아티팩트 뷰어가 세운 것)을, 그것도 없으면 기기 설정을.
  const host = document.documentElement.getAttribute('data-theme');
  const theme = chosen ?? (host === 'dark' || host === 'light' ? host : system);

  useEffect(() => {
    const mq = darkQuery();
    if (!mq) return;
    const on = () => setSystem(mq.matches ? 'dark' : 'light');
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  // 고른 때만 뿌리에 적는다 — 안 고른 사람은 CSS의 prefers-color-scheme이 맡고, 뷰어가 세운 값도 덮지 않는다.
  useEffect(() => {
    if (chosen) document.documentElement.setAttribute('data-theme', chosen);
  }, [chosen]);

  const value = useMemo<Prefs>(
    () => ({
      character,
      setCharacter,
      theme,
      toggleTheme: () => setChosen(theme === 'dark' ? 'light' : 'dark'),
    }),
    [character, setCharacter, theme, setChosen],
  );
  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs(): Prefs {
  const v = useContext(PrefsContext);
  if (!v) throw new Error('usePrefs outside PrefsProvider');
  return v;
}

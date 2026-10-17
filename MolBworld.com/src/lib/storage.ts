/**
 * 브라우저 저장소(localStorage) — 블랭크북 · 찍먹 기록 · 고른 캐릭터 · 테마.
 *
 * 서버로 가는 것은 하나도 없다. 사생활 창 · 막힌 사이트 데이터 · 꽉 찬 저장소에서는 읽기 · 쓰기가 던질 수 있으므로
 * 전부 try/catch로 감싸고, 못 쓰면 화면은 그대로 돌되 [storageHealthy]가 false가 된다(블랭크북이 띠로 알린다).
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export const PREFIX = 'molbworld.';

let healthy = true;
const listeners = new Set<() => void>();

export function storageHealthy(): boolean {
  return healthy;
}

function setHealthy(v: boolean) {
  if (healthy === v) return;
  healthy = v;
  listeners.forEach((f) => f());
}

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    setHealthy(true);
    return true;
  } catch {
    setHealthy(false);
    return false;
  }
}

export function removeKey(key: string): void {
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    /* 지울 수 없으면 둔다 */
  }
}

/** 저장되는 useState — 다른 탭에서 바뀌면(storage 이벤트) 따라 바뀐다. */
export function usePersistentState<T>(
  key: string,
  initial: T,
  sanitize?: (v: unknown) => T,
): [T, (next: T | ((prev: T) => T)) => void] {
  const clean = useRef(sanitize);
  const [value, setValue] = useState<T>(() => {
    const raw = readJSON<unknown>(key, initial);
    return clean.current ? clean.current(raw) : (raw as T);
  });

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const v = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        writeJSON(key, v);
        return v;
      });
    },
    [key],
  );

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== PREFIX + key || e.newValue == null) return;
      try {
        const raw = JSON.parse(e.newValue) as unknown;
        setValue(clean.current ? clean.current(raw) : (raw as T));
      } catch {
        /* 다른 탭이 깨진 값을 썼으면 무시 */
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key]);

  return [value, set];
}

export function useStorageHealth(): boolean {
  const [ok, setOk] = useState(healthy);
  useEffect(() => {
    const f = () => setOk(healthy);
    listeners.add(f);
    return () => {
      listeners.delete(f);
    };
  }, []);
  return ok;
}

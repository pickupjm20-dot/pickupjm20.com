/**
 * **폰에서 앱처럼** — 오프라인 일꾼(`public` 빌드의 sw.js)을 붙이고, 홈 화면에 두는 길을 알려 준다.
 *
 * 안드로이드 크롬은 조건(매니페스트 · 일꾼 · https)이 맞으면 `beforeinstallprompt`를 한 번 보낸다 — 그것을 붙잡아 두었다가 우리 단추로
 * 띄운다. iOS 사파리는 그 이벤트가 없어 '공유 → 홈 화면에 추가'를 말로 알린다. 이미 홈 화면에서 열었으면 아무것도 안 띄운다.
 */
import { useEffect, useState } from 'react';

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

let deferred: InstallPrompt | null = null;
const listeners = new Set<() => void>();
const tell = () => listeners.forEach((f) => f());

/** 앱이 그려지기 전에 한 번 — 이벤트는 첫 그림보다 먼저 올 수 있다. */
export function startOffline(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallPrompt;
    tell();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    tell();
  });
  // 일꾼은 빌드판 · 안전한 곳(https · localhost) · 맨 위 창에서만. 남의 화면 안(아티팩트 뷰어 같은 iframe)에서는 붙일 일꾼도 없고,
  // 샌드박스면 navigator.serviceWorker를 읽기만 해도 던질 수 있다 — 조용히 넘어간다(사이트는 일꾼 없이도 돈다).
  if (!import.meta.env.PROD || !window.isSecureContext || window.top !== window.self) return;
  window.addEventListener('load', () => {
    try {
      navigator.serviceWorker?.register('./sw.js').catch(() => {});
    } catch {
      /* 일꾼을 못 붙이는 곳 */
    }
  });
}

export type InstallState = 'installed' | 'prompt' | 'ios' | 'none';

function current(): InstallState {
  const standalone =
    window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (standalone) return 'installed';
  // 남의 화면 안(아티팩트 뷰어 같은 iframe)에서는 홈 화면에 둘 것이 이 사이트가 아니다 — 안내하지 않는다.
  if (window.top !== window.self) return 'none';
  if (deferred) return 'prompt';
  if (/iPhone|iPad|iPod/.test(navigator.userAgent)) return 'ios';
  return 'none';
}

export function useInstall(): { state: InstallState; install: () => Promise<void> } {
  const [state, setState] = useState<InstallState>(current);
  useEffect(() => {
    const on = () => setState(current());
    listeners.add(on);
    return () => {
      listeners.delete(on);
    };
  }, []);
  const install = async () => {
    const e = deferred;
    if (!e) return;
    await e.prompt();
    const { outcome } = await e.userChoice;
    if (outcome === 'accepted') deferred = null;
    setState(current());
  };
  return { state, install };
}

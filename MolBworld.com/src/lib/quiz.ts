/**
 * 뜻 적기 퀴즈의 채점 — 앱의 복습 퀴즈처럼 낱말을 보고 **뜻을 적는다**.
 *
 * 한국어 뜻은 적는 모습이 여럿이라(‘원하다’ · ‘원해요’ · ‘~하고 싶다’) 너그럽게 맞춘다: 빈칸 · 물결표 · 문장부호를
 * 떼고, 쉼표 · 빗금으로 갈린 뜻 하나라도 맞으면, 또 서로 품으면(두 글자 이상) 맞힌 것. 그래도 엇갈리면 사용자가
 * '맞은 걸로'를 누른다 — 판정은 사람이 이긴다.
 *
 * **복습 일정은 없다.** 앱은 맞고 틀린 결과로 FSRS-6 일정(다음 복습일)을 다시 셈하지만, 사이트는 맞힌 · 틀린
 * 횟수만 적는다. 화면의 '복습 알고리즘 꺼짐' 표시가 그 말이다.
 */

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[~～∼·.,!?'"“”‘’…:;()[\]{}<>-]/g, '')
    .replace(/\s+/g, '');
}

/** 뜻 한 줄을 맞춰 볼 모습들 — 괄호 속을 뺀 것과 괄호만 벗긴 것. */
function variants(meaning: string): string[] {
  const parts = meaning.split(/[,/;，、]|\s또는\s/).map((p) => p.trim()).filter(Boolean);
  const out = new Set<string>();
  for (const p of parts) {
    const without = norm(p.replace(/\([^)]*\)/g, ''));
    const unwrapped = norm(p);
    if (without) out.add(without);
    if (unwrapped) out.add(unwrapped);
  }
  return [...out];
}

export function gradeMeaning(answer: string, meaning: string): boolean {
  const a = norm(answer);
  if (!a) return false;
  for (const v of variants(meaning)) {
    if (v === a) return true;
    if (a.length >= 2 && v.includes(a)) return true;
    if (v.length >= 2 && a.includes(v)) return true;
    // ‘원하다’ ↔ ‘원하’처럼 끝의 ‘다’만 다른 것
    const va = v.endsWith('다') ? v.slice(0, -1) : v;
    const aa = a.endsWith('다') ? a.slice(0, -1) : a;
    if (va.length >= 2 && va === aa) return true;
  }
  return false;
}

/** 섞기 — 사이트의 퀴즈 순서는 무작위다(앱은 FSRS가 고른 '오늘 볼 낱말' 순서). */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j] as T, a[i] as T];
  }
  return a;
}

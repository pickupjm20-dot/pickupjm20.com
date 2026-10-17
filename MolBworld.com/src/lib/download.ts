/** 파일로 내려 주기 · 파일 읽기 — 블랭크북의 내보내기 · 가져오기 · .txt 열기. */
import type { SavedWord } from './library';

export function download(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ''));
    r.onerror = () => reject(r.error ?? new Error('read failed'));
    r.readAsText(file);
  });
}

const cell = (v: string | number) => {
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** 단어장 CSV — 엑셀이 한글을 깨뜨리지 않게 BOM을 붙인다. Anki 같은 곳으로 옮길 때도 쓴다. */
export function wordsToCsv(words: SavedWord[]): string {
  const head = ['word', 'meaning', 'sentence', 'from', 'level', 'added', 'right', 'wrong'];
  const rows = words.map((w) =>
    [w.id, w.meaning, w.sentence, w.from, w.level, new Date(w.addedAt).toISOString().slice(0, 10), w.right, w.wrong]
      .map(cell)
      .join(','),
  );
  return `﻿${[head.join(','), ...rows].join('\r\n')}`;
}

export const today = () => new Date().toISOString().slice(0, 10);

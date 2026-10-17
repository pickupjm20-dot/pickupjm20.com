/** 책장 — 내 책들, 새 책, 그리고 이 브라우저에 저장된 장부의 손잡이(내보내기 · 가져오기 · 모두 지우기). */
import { useRef } from 'react';
import { DownloadIcon, PlusIcon, TrashIcon, UploadIcon } from '../../components/Icons';
import type { Library } from '../../lib/library';
import { countWords } from '../../lib/text';

export function Shelf({
  lib,
  selected,
  onSelect,
  onNew,
  onSample,
  onExport,
  onImport,
  onClear,
  storageOk,
}: {
  lib: Library;
  selected: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onSample: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onClear: () => void;
  storageOk: boolean;
}) {
  const file = useRef<HTMLInputElement>(null);
  const bytes = new Blob([JSON.stringify(lib)]).size;
  return (
    <div className="shelf">
      <div className="shelf__head">
        <h2>책장</h2>
        <button type="button" className="btn btn--primary btn--sm" onClick={onNew}>
          <PlusIcon size={16} /> 새 책
        </button>
      </div>
      {lib.books.length === 0 ? (
        <div className="shelf__empty">
          <p>아직 책이 없어요. 읽고 싶은 영어 글을 붙여 넣거나, 예시 글로 손짓부터 해 보세요.</p>
          <button type="button" className="btn btn--outline btn--sm" onClick={onSample}>
            예시 글로 시작하기
          </button>
        </div>
      ) : (
        <ul className="shelf__list">
          {lib.books.map((b) => {
            const saved = lib.words.filter((w) => w.bookId === b.id).length;
            return (
              <li key={b.id}>
                <button
                  type="button"
                  className={`shelf__book${b.id === selected ? ' is-on' : ''}`}
                  aria-current={b.id === selected ? 'true' : undefined}
                  onClick={() => onSelect(b.id)}
                >
                  <span className="shelf__spine" aria-hidden="true" />
                  <span className="shelf__title">{b.title}</span>
                  <span className="shelf__meta">
                    낱말 {countWords(b.text)} · 담은 {saved} · {new Date(b.updatedAt).toLocaleDateString('ko-KR')}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="shelf__tools">
        <p className="shelf__storage">
          <span className={`dot${storageOk ? '' : ' dot--alert'}`} aria-hidden="true" />
          {storageOk ? `이 브라우저에 저장 중 · 약 ${Math.max(1, Math.round(bytes / 1024))}KB` : '저장소에 쓸 수 없어요 — 사생활 창이거나 꽉 찼어요. 지금 내용을 내보내 두세요.'}
        </p>
        <div className="shelf__btns">
          <button type="button" className="btn btn--ghost btn--sm" onClick={onExport}>
            <DownloadIcon size={16} /> 내보내기
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => file.current?.click()}>
            <UploadIcon size={16} /> 가져오기
          </button>
          <input
            ref={file}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImport(f);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            className="btn btn--ghost btn--sm btn--danger"
            onClick={onClear}
            disabled={lib.books.length === 0 && lib.words.length === 0}
          >
            <TrashIcon size={16} /> 모두 지우기
          </button>
        </div>
      </div>
    </div>
  );
}

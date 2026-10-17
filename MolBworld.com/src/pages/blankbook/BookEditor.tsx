/** 새 책 · 책 고치기 — 제목과 글. 글은 붙여 넣거나 .txt를 연다. */
import { useRef, useState } from 'react';
import { UploadIcon } from '../../components/Icons';
import { readFileText } from '../../lib/download';
import { MAX_BOOK_CHARS } from '../../lib/library';
import { buildDoc } from '../../lib/text';

export function BookEditor({
  initialTitle = '',
  initialText = '',
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initialTitle?: string;
  initialText?: string;
  submitLabel: string;
  onSubmit: (title: string, text: string) => void;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [text, setText] = useState(initialText);
  const [err, setErr] = useState('');
  const file = useRef<HTMLInputElement>(null);
  const doc = buildDoc(text);
  const latin = (text.match(/[A-Za-z]/g) ?? []).length;
  const mostlyKorean = text.trim().length > 20 && latin / text.replace(/\s/g, '').length < 0.3;

  const open = async (f: File) => {
    setErr('');
    if (!/\.txt$/i.test(f.name) && f.type && !f.type.startsWith('text/')) {
      setErr('사이트에서는 .txt만 열 수 있어요. .pdf · .docx · 사진은 앱에서 열 수 있어요.');
      return;
    }
    try {
      const body = await readFileText(f);
      setText(body.slice(0, MAX_BOOK_CHARS));
      if (!title.trim()) setTitle(f.name.replace(/\.txt$/i, ''));
      if (body.length > MAX_BOOK_CHARS) setErr(`글이 길어서 앞의 ${MAX_BOOK_CHARS.toLocaleString()}자만 담았어요.`);
    } catch {
      setErr('파일을 읽지 못했어요.');
    }
  };

  return (
    <form
      className="editor"
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) {
          setErr('글을 붙여 넣어 주세요.');
          return;
        }
        onSubmit(title, text);
      }}
    >
      <label className="editor__label" htmlFor="book-title">
        제목
      </label>
      <input
        id="book-title"
        className="field editor__title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="비워 두면 첫 줄이 제목이 돼요"
        maxLength={120}
      />
      <div className="editor__row">
        <label className="editor__label" htmlFor="book-text">
          영어 글
        </label>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => file.current?.click()}>
          <UploadIcon size={16} /> .txt 열기
        </button>
        <input
          ref={file}
          type="file"
          accept=".txt,text/plain"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void open(f);
            e.target.value = '';
          }}
        />
      </div>
      <textarea
        id="book-text"
        className="field editor__text"
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, MAX_BOOK_CHARS))}
        placeholder={'교재 지문, 기사, 가사, 메일… 읽고 싶은 영어 글을 붙여 넣어요.\n\n빈 줄로 문단을 나누면 그대로 문단이 돼요.'}
        rows={14}
        spellCheck={false}
      />
      <p className="editor__count">
        문단 {doc.paragraphs.length} · 문장 {doc.sentenceCount} · 낱말 {doc.wordCount} · {text.length.toLocaleString()} /{' '}
        {MAX_BOOK_CHARS.toLocaleString()}자
      </p>
      {mostlyKorean && <p className="editor__warn">영어가 거의 없는 글 같아요. 블랭크북은 영어 글을 읽는 책이에요.</p>}
      {err && (
        <p className="editor__warn" role="alert">
          {err}
        </p>
      )}
      <div className="editor__actions">
        <button type="submit" className="btn btn--primary">
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            취소
          </button>
        )}
      </div>
    </form>
  );
}

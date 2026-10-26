/**
 * 북 페이지 — '내 블랭크북' · 학습주제 n개 · 외울 것 m개 · 내 타자 칩, 책 한 권씩(표지 빛 · 책등 · 이름 · 주제/외울 것 · 맞힌 비율 막대 ·
 * 다시 볼 수 · 마지막 공부), 끝에 점선 '+ 새 학습주제'(시트 — 빈 학습주제 · 파일에서 · AI 자료 붙여 넣기 · 부탁 글 복사 · 예시).
 */
import { useRef, useState } from 'react';
import { Dialog } from '../../components/Dialog';
import { DownloadIcon, PlusIcon, UploadIcon } from '../../components/Icons';
import { Mascot } from '../../components/Mascot';
import { ReviewOffBadge } from '../../components/ReviewOffBadge';
import { coverVar, newBook, termKey, type BlankBook } from '../../lib/blank/book';
import { bookFromMaterial, bookFromPlainText, MATERIAL_PROMPT, parseQuotedMaterial, withoutMaterialPrompt } from '../../lib/blank/material';
import { bookAccuracy, reviewCount } from '../../lib/blank/quiz';
import { SAMPLES } from '../../lib/blank/samples';
import type { BlankStore } from '../../lib/blank/store';
import type { TypingStats } from '../../lib/blank/typing';
import { readFileText } from '../../lib/download';
import { TypingChip } from './Typing';

type Props = {
  store: BlankStore;
  typing: TypingStats;
  storageOk: boolean;
  onOpen: (id: string) => void;
  onCreate: (book: BlankBook, notice?: string) => void;
  onSample: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onTyping: () => void;
  onNotice: (msg: string) => void;
};

export function Shelf(props: Props) {
  const { store, typing, onOpen, onSample, onTyping } = props;
  const [sheet, setSheet] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const terms = store.books.reduce((n, b) => n + b.terms.length, 0);

  return (
    <div className="shelf">
      <div className="shelf__head">
        <div>
          <h2 className="shelf__title">내 블랭크북</h2>
          <p className="shelf__sub">
            학습주제 {store.books.length}개 · 외울 것 {terms}개
          </p>
        </div>
        <div className="shelf__tools">
          <TypingChip stats={typing} onOpen={onTyping} />
          <button type="button" className="btn btn--ghost btn--sm" onClick={props.onExport} disabled={store.books.length === 0}>
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
              if (f) props.onImport(f);
              e.target.value = '';
            }}
          />
        </div>
      </div>
      {!props.storageOk && (
        <p className="shelf__warn" role="alert">
          이 브라우저에 저장할 수 없어요 — 사생활 창이거나 저장소가 꽉 찼어요. 지금 것을 내보내 두세요.
        </p>
      )}

      {store.books.length === 0 && (
        <div className="shelf__intro">
          <Mascot pose="writing" size={96} />
          <div>
            <p>
              학습주제마다 책을 한 권 만들고 개념을 필기해요.
              <br />
              외울 부분을 <b>"큰따옴표"</b>로 감싸면 맞춰 보기에서 빈칸이 돼요.
              <br />
              안 푼 것 · 틀린 것이 먼저 나와요.
            </p>
            <p className="shelf__intro-sub">처음이라면 예시로 바로 맞춰 봐요 — 학교 공부 · 자격증 · 영어 무엇이든 돼요.</p>
          </div>
        </div>
      )}

      <ul className="books">
        {store.books.map((b) => (
          <BookCard key={b.id} book={b} store={store} onOpen={() => onOpen(b.id)} onRename={props.onRename} onDelete={props.onDelete} />
        ))}
        <li>
          <button type="button" className="books__new" onClick={() => setSheet(true)}>
            <PlusIcon size={22} />
            <span>새 학습주제</span>
          </button>
        </li>
      </ul>

      <div className="samples">
        <p className="samples__label">예시로 해 보기</p>
        <ul>
          {SAMPLES.map((s) => {
            const made = store.books.find((b) => b.sample === s.id);
            return (
              <li key={s.id}>
                <button type="button" className="sample-btn" onClick={() => (made ? onOpen(made.id) : onSample(s.id))}>
                  <span className="sample-btn__kind">{s.kind}</span>
                  <span>{s.label}</span>
                  {made && <span className="sample-btn__made">만듦</span>}
                </button>
              </li>
            );
          })}
        </ul>
        <ReviewOffBadge />
      </div>

      {sheet && <NewTopicSheet onClose={() => setSheet(false)} onCreate={props.onCreate} onNotice={props.onNotice} />}
    </div>
  );
}

function BookCard({
  book,
  store,
  onOpen,
  onRename,
  onDelete,
}: {
  book: BlankBook;
  store: BlankStore;
  onOpen: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}) {
  const stats = store.stats[book.id] ?? {};
  const keys = book.terms.map((t) => termKey(t.text));
  const acc = bookAccuracy(keys, stats);
  const due = reviewCount(keys, stats);
  const studied = book.studiedAt ? new Date(book.studiedAt) : null;
  const [menu, setMenu] = useState<'closed' | 'open' | 'rename' | 'delete'>('closed');
  const [name, setName] = useState(book.title);
  return (
    <li className="book-card" style={{ ['--cover' as string]: `var(${coverVar(book.id)})` }}>
      <button type="button" className="book-card__open" onClick={onOpen}>
        <span className="book-card__spine" aria-hidden="true" />
        <span className="book-card__title">{book.title}</span>
        <span className="book-card__meta">
          주제 {book.pages.length} · 외울 것 {book.terms.length}
        </span>
        <span className="book-card__bar" aria-hidden="true">
          <i style={{ width: `${acc == null ? 0 : Math.round(acc * 100)}%` }} />
        </span>
        <span className="book-card__meta">{acc == null ? '아직 안 맞춰 봤어요' : `맞힌 비율 ${Math.round(acc * 100)}%`}</span>
        <span className="book-card__foot">
          {due > 0 && <span className="book-card__due">다시 볼 {due}</span>}
          {studied && (
            <span>
              마지막 공부 {studied.getMonth() + 1}월 {studied.getDate()}일
            </span>
          )}
        </span>
      </button>
      <div className="book-card__menu">
        <button
          type="button"
          className="book-card__more"
          aria-label={`${book.title} 이름 바꾸기 · 지우기`}
          aria-expanded={menu !== 'closed'}
          onClick={() => setMenu((m) => (m === 'closed' ? 'open' : 'closed'))}
        >
          ⋯
        </button>
        {menu === 'open' && (
          <div className="book-card__pop">
            <button type="button" onClick={() => setMenu('rename')}>
              이름 바꾸기
            </button>
            <button type="button" className="danger" onClick={() => setMenu('delete')}>
              지우기
            </button>
          </div>
        )}
        {menu === 'rename' && (
          <form
            className="book-card__pop"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) onRename(book.id, name.trim());
              setMenu('closed');
            }}
          >
            <label className="sr-only" htmlFor={`rename-${book.id}`}>
              학습주제 이름
            </label>
            <input id={`rename-${book.id}`} className="field field--sm" value={name} onChange={(e) => setName(e.target.value)} autoFocus maxLength={120} />
            <div className="book-card__pop-row">
              <button type="button" onClick={() => setMenu('closed')}>
                취소
              </button>
              <button type="submit" className="ok">
                바꾸기
              </button>
            </div>
          </form>
        )}
        {menu === 'delete' && (
          <div className="book-card__pop" role="alertdialog" aria-label="학습주제 지우기">
            <p>
              필기 {book.pages.length}개와 푼 기록이 함께 지워져요. 타자 기록은 남아요.
            </p>
            <div className="book-card__pop-row">
              <button type="button" onClick={() => setMenu('closed')}>
                취소
              </button>
              <button type="button" className="danger" onClick={() => onDelete(book.id)}>
                지우기
              </button>
            </div>
          </div>
        )}
      </div>
    </li>
  );
}

type Mode = 'menu' | 'empty' | 'paste';

/** + 새 학습주제 — 빈 학습주제 · 파일에서(.txt · .md) · AI 자료 붙여 넣기 · 부탁 글 복사. 사이트는 AI를 부르지 않는다: AI 채팅에서 만든 자료를 붙여 넣는 길이다. */
function NewTopicSheet({ onClose, onCreate, onNotice }: { onClose: () => void; onCreate: (b: BlankBook, notice?: string) => void; onNotice: (m: string) => void }) {
  const [mode, setMode] = useState<Mode>('menu');
  const [name, setName] = useState('');
  const [paste, setPaste] = useState('');
  const [err, setErr] = useState('');
  const file = useRef<HTMLInputElement>(null);

  const fromText = (raw: string, fallback: string) => {
    const text = withoutMaterialPrompt(raw);
    if (!text.trim()) {
      setErr(raw.trim() ? '아직 부탁 글이에요 — AI 채팅에 붙여 넣고, AI가 만든 답을 복사해 와요.' : '붙여 넣은 글이 없어요.');
      return;
    }
    const m = parseQuotedMaterial(text);
    if (m) {
      const book = bookFromMaterial(m, fallback);
      onCreate(book, m.terms.length ? `따옴표 낱말 ${m.terms.length}개가 빈칸이 됐어요${m.sections.length > 1 ? ` · 주제 ${m.sections.length}개` : ''}` : `외울 낱말 ${book.terms.length}개를 먼저 칠했어요 — 카드의 칠하기로 빼고 더해요`);
      return;
    }
    const book = bookFromPlainText(text, fallback);
    onCreate(book, `외울 낱말 ${book.terms.length}개를 먼저 칠했어요 — 카드의 칠하기로 빼고 더해요`);
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(MATERIAL_PROMPT);
      onNotice('부탁 글을 복사했어요 — AI 채팅에 붙여 넣고 끝에 주제를 적어요');
    } catch {
      onNotice('복사가 막혀 있어요 — 아래 부탁 글을 직접 골라 복사해요');
      setMode('paste');
    }
  };

  return (
    <Dialog title="새 학습주제" onClose={onClose} wide={mode === 'paste'}>
      {mode === 'menu' && (
        <ul className="newtopic">
          <li>
            <button type="button" onClick={() => setMode('empty')}>
              <b>📖 빈 학습주제</b>
              <span>주제 카드에 제목 · 내용을 적고, 외울 말은 "큰따옴표"로</span>
            </button>
          </li>
          <li>
            <button type="button" onClick={() => file.current?.click()}>
              <b>📁 파일에서</b>
              <span>.txt · .md — 제목 · 내용, 외울 말은 큰따옴표 꼴의 글(그냥 글이면 규칙으로 먼저 칠해요)</span>
            </button>
            <input
              ref={file}
              type="file"
              accept=".txt,.md,text/plain,text/markdown"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (!f) return;
                try {
                  fromText(await readFileText(f), f.name.replace(/\.(txt|md)$/i, ''));
                } catch {
                  setErr('파일을 못 읽었어요.');
                }
              }}
            />
          </li>
          <li>
            <button type="button" onClick={() => setMode('paste')}>
              <b>📋 AI 자료 붙여 넣기</b>
              <span>ChatGPT · Claude · Gemini가 만든 '제목 · 내용, 외울 말은 큰따옴표' 꼴의 글</span>
            </button>
          </li>
          <li>
            <button type="button" onClick={() => void copyPrompt()}>
              <b>✨ 부탁 글 복사</b>
              <span>AI 채팅에 붙여 넣고 끝에 주제를 적어요 — 꼴에 맞춘 자료를 만들어 줘요</span>
            </button>
          </li>
        </ul>
      )}

      {mode === 'empty' && (
        <form
          className="newtopic__form"
          onSubmit={(e) => {
            e.preventDefault();
            onCreate(newBook(name || '새 학습주제'));
          }}
        >
          <label htmlFor="topic-name">학습주제 이름</label>
          <input id="topic-name" className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 정보처리기사 · 데이터베이스" maxLength={120} />
          <div className="newtopic__actions">
            <button type="button" className="btn btn--ghost" onClick={() => setMode('menu')}>
              뒤로
            </button>
            <button type="submit" className="btn btn--primary">
              만들기
            </button>
          </div>
        </form>
      )}

      {mode === 'paste' && (
        <div className="newtopic__form">
          <details className="newtopic__prompt">
            <summary>부탁 글 보기 · 복사</summary>
            <pre>{MATERIAL_PROMPT}</pre>
          </details>
          <label htmlFor="topic-paste">AI가 만든 자료</label>
          <textarea
            id="topic-paste"
            className="field newtopic__paste"
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            rows={10}
            placeholder={'제목: 광합성\n"광합성"은 식물이 "빛 에너지"를 이용해 "포도당"을 만드는 과정이다.\n\n제목: 세포 호흡\n"미토콘드리아"에서 포도당을 분해해 "ATP"를 얻는다.'}
          />
          <div className="newtopic__actions">
            <button type="button" className="btn btn--ghost" onClick={() => setMode('menu')}>
              뒤로
            </button>
            {'clipboard' in navigator && 'readText' in navigator.clipboard && (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={async () => {
                  try {
                    setPaste(await navigator.clipboard.readText());
                  } catch {
                    setErr('클립보드를 읽지 못했어요 — 칸에 직접 붙여 넣어요(Ctrl/⌘ + V).');
                  }
                }}
              >
                클립보드에서
              </button>
            )}
            <button type="button" className="btn btn--primary" onClick={() => fromText(paste, '붙여 넣은 자료')}>
              책 만들기
            </button>
          </div>
        </div>
      )}
      {err && (
        <p className="newtopic__err" role="alert">
          {err}
        </p>
      )}
    </Dialog>
  );
}

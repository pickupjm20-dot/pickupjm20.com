/**
 * 블랭크북 — 외울 말을 지운 빈칸을 쳐서 채우는 공부. 앱(리더 탭의 셋째 화면, 10-16 ~ 10-19)에 있다가 걷힌 기능을 사이트로 옮겼다 —
 * 사용자: "블랭크북 기능(이건 사이트에서 하기 편하고, 로컬 캐시로 둬도 되니까 다 해도 될 거 같아)". 원본은 웹 '과연 내가 외웠을까?'.
 *
 * 두 장이다 — **북 페이지**(책 목록)와 **공부 화면**([개념 필기 | 맞춰 보기]). 주소: `#/blankbook` · `#/blankbook/<책>` ·
 * `#/blankbook/<책>/quiz` · `#/blankbook/sample/<예시>`(예시 책을 만들고 연다).
 *
 * 사이트판에서 뺀 것: OCR(PDF · 사진) · AI(조사 확인 · 고르기) · FSRS 복습 일정. 조사는 기기의 짐작 + 사람이 고친 것, 문제 차례는 안 푼 것 ·
 * 틀린 것 먼저(일정 없음 — '복습 알고리즘 꺼짐').
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dialog } from '../components/Dialog';
import { ArrowLeft } from '../components/Icons';
import { ReviewOffBadge } from '../components/ReviewOffBadge';
import type { BlankBook } from '../lib/blank/book';
import { SAMPLES, sampleBook } from '../lib/blank/samples';
import {
  addRound,
  BLANK_KEY,
  deleteBook,
  EMPTY_STORE,
  exportStore,
  mergeStore,
  recordAnswer,
  sanitizeStore,
  upsertBook,
  type BlankStore,
} from '../lib/blank/store';
import { typingStats } from '../lib/blank/typing';
import { download, readFileText, today } from '../lib/download';
import { usePersistentState, useStorageHealth } from '../lib/storage';
import { Notes } from './blankbook/Notes';
import { newRound, Quiz, type Round } from './blankbook/Quiz';
import { Shelf } from './blankbook/Shelf';
import { TypingSheet } from './blankbook/Typing';

const go = (path: string) => {
  window.location.hash = `#/blankbook${path}`;
};

export function BlankBookPage({ rest }: { rest: string[] }) {
  const [store, setStore] = usePersistentState(BLANK_KEY, EMPTY_STORE, sanitizeStore);
  const storageOk = useStorageHealth();
  const [notice, setNotice] = useState('');
  const [typingOpen, setTypingOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const rounds = useRef(new Map<string, Round>());
  const [, bumpRounds] = useState(0);
  const typing = useMemo(() => typingStats(store.rounds), [store.rounds]);

  const [head, sub] = rest;
  const book = head && head !== 'sample' ? store.books.find((b) => b.id === head) ?? null : null;
  const tab = sub === 'quiz' ? 'quiz' : 'notes';

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(''), 3600);
    return () => window.clearTimeout(t);
  }, [notice]);

  // 예시 — 이미 만든 예시면 그 책을, 아니면 새로 만들어 연다. 같은 예시를 두 번 짓지 않게 지은 것을 기억한다
  // (장부가 바뀌기 전에 이 효과가 다시 돌 수 있다 — 개발 모드의 StrictMode가 그렇다).
  const building = useRef<string | null>(null);
  useEffect(() => {
    if (head !== 'sample') return;
    const s = SAMPLES.find((x) => x.id === sub);
    if (!s) return go('');
    const made = store.books.find((b) => b.sample === s.id);
    if (made) return go(`/${made.id}`);
    if (building.current === s.id) return;
    building.current = s.id;
    const b = sampleBook(s);
    setStore((cur) => upsertBook(cur, b));
    setNotice(`‘${s.label}’ 예시를 만들었어요 — 맞춰 보기로 빈칸을 쳐 봐요`);
    go(`/${b.id}`);
  }, [head, sub, store.books, setStore]);

  // 없는 책을 가리키면 책 목록으로.
  useEffect(() => {
    if (head && head !== 'sample' && !book) go('');
  }, [head, book]);

  const saveBook = useCallback((b: BlankBook) => setStore((cur) => upsertBook(cur, b)), [setStore]);

  const onImport = async (file: File) => {
    try {
      const incoming = sanitizeStore(JSON.parse(await readFileText(file)));
      if (incoming.books.length === 0) {
        setNotice('가져올 학습주제가 없는 파일이에요.');
        return;
      }
      setStore((cur) => mergeStore(cur, incoming));
      setNotice(`학습주제 ${incoming.books.length}권을 합쳤어요(이미 있는 것은 그대로).`);
    } catch {
      setNotice('블랭크북 내보내기 파일(JSON)이 아니에요.');
    }
  };

  const roundOf = (id: string) => {
    let r = rounds.current.get(id);
    if (!r) {
      r = newRound();
      rounds.current.set(id, r);
    }
    return r;
  };

  return (
    <div className="bb">
      <div className="container bb__inner">
        {book ? (
          <Study
            book={book}
            tab={tab}
            store={store}
            round={roundOf(book.id)}
            onBack={() => go('')}
            onTab={(t) => go(t === 'quiz' ? `/${book.id}/quiz` : `/${book.id}`)}
            onSave={saveBook}
            onMove={(from, to) => setStore((cur) => upsertBook(upsertBook(cur, from), to))}
            onAnswer={(key, correct) => setStore((cur) => recordAnswer(cur, book.id, key, correct))}
            onRow={(row) => setStore((cur) => addRound(cur, row))}
            onIgnoreSpace={(v) => setStore((cur) => ({ ...cur, ignoreSpace: v }))}
            onRestart={(only) => {
              rounds.current.set(book.id, newRound(only));
              bumpRounds((n) => n + 1);
            }}
            onNotice={setNotice}
          />
        ) : (
          <>
            <header className="bb__head">
              <a className="bb__back" href="#/">
                <ArrowLeft size={16} /> MolB World
              </a>
              <div className="bb__title-row">
                <img src={`${import.meta.env.BASE_URL}img/icons/notebook.webp`} alt="" width={56} height={56} />
                <div>
                  <h1 className="bb__title">블랭크북</h1>
                  <p className="bb__sub">외울 말을 지우고, 쳐서 채우는 빈 책 · 학교 공부 · 자격증 · 영어</p>
                </div>
              </div>
            </header>
            <Shelf
              store={store}
              typing={typing}
              storageOk={storageOk}
              onOpen={(id) => go(`/${id}`)}
              onCreate={(b, msg) => {
                setStore((cur) => upsertBook(cur, b));
                if (msg) setNotice(msg);
                go(`/${b.id}`);
              }}
              onSample={(id) => go(`/sample/${id}`)}
              onRename={(id, title) => setStore((cur) => ({ ...cur, books: cur.books.map((b) => (b.id === id ? { ...b, title } : b)) }))}
              onDelete={(id) => {
                rounds.current.delete(id);
                setStore((cur) => deleteBook(cur, id));
              }}
              onExport={() => setExportOpen(true)}
              onImport={(f) => void onImport(f)}
              onTyping={() => setTypingOpen(true)}
              onNotice={setNotice}
            />
          </>
        )}
      </div>
      {typingOpen && <TypingSheet stats={typing} onClose={() => setTypingOpen(false)} />}
      {exportOpen && <ExportSheet json={exportStore(store)} onClose={() => setExportOpen(false)} onNotice={setNotice} />}
      {notice && (
        <p className="toast" role="status">
          {notice}
        </p>
      )}
    </div>
  );
}

function Study({
  book,
  tab,
  store,
  round,
  onBack,
  onTab,
  onSave,
  onMove,
  onAnswer,
  onRow,
  onIgnoreSpace,
  onRestart,
  onNotice,
}: {
  book: BlankBook;
  tab: 'notes' | 'quiz';
  store: BlankStore;
  round: Round;
  onBack: () => void;
  onTab: (t: 'notes' | 'quiz') => void;
  onSave: (b: BlankBook) => void;
  onMove: (from: BlankBook, to: BlankBook) => void;
  onAnswer: (key: string, correct: boolean) => void;
  onRow: Parameters<typeof Quiz>[0]['onRow'];
  onIgnoreSpace: (v: boolean) => void;
  onRestart: (only: Set<string> | null) => void;
  onNotice: (m: string) => void;
}) {
  const [title, setTitle] = useState(book.title);
  useEffect(() => setTitle(book.title), [book.title]);
  const stats = store.stats[book.id] ?? {};

  return (
    <div className="study">
      <div className="study__bar">
        <button type="button" className="bb__back" onClick={onBack}>
          <ArrowLeft size={16} /> 책 목록
        </button>
        <ReviewOffBadge align="right" />
      </div>
      <input
        className="study__title"
        value={title}
        aria-label="학습주제 이름"
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => title.trim() && title !== book.title && onSave({ ...book, title: title.trim() })}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'Escape') {
            setTitle(book.title);
            (e.target as HTMLInputElement).blur();
          }
        }}
      />
      <div className="seg study__tabs" role="tablist" aria-label="공부 화면">
        <button type="button" role="tab" aria-selected={tab === 'notes'} onClick={() => onTab('notes')}>
          개념 필기
        </button>
        <button type="button" role="tab" aria-selected={tab === 'quiz'} onClick={() => onTab('quiz')}>
          맞춰 보기
        </button>
      </div>
      {tab === 'notes' ? (
        <Notes
          book={book}
          others={store.books.filter((b) => b.id !== book.id)}
          stats={stats}
          onChange={onSave}
          onMove={onMove}
          onNotice={onNotice}
        />
      ) : (
        <Quiz
          key={round.id}
          book={book}
          stats={stats}
          rounds={store.rounds}
          round={round}
          ignoreSpace={store.ignoreSpace}
          onIgnoreSpace={onIgnoreSpace}
          onAnswer={onAnswer}
          onRow={onRow}
          onRestart={onRestart}
          onGoNotes={() => onTab('notes')}
        />
      )}
    </div>
  );
}

/**
 * 내보내기 — 파일로 받기, 그리고 글로 복사하기. 파일 받기가 막힌 곳(앱 안의 보기 · 일부 브라우저)에서도 옮길 수 있게 JSON을 그대로
 * 보여 주고 복사 단추를 둔다. 가져오기는 그 글을 .json 파일로 저장해 책장의 '가져오기'로.
 */
function ExportSheet({ json, onClose, onNotice }: { json: string; onClose: () => void; onNotice: (m: string) => void }) {
  const area = useRef<HTMLTextAreaElement>(null);
  return (
    <Dialog title="블랭크북 내보내기" onClose={onClose} wide>
      <p className="export__lead">학습주제 · 푼 기록 · 타자 기록을 JSON으로 옮겨요. 다른 브라우저의 블랭크북에서 ‘가져오기’로 살릴 수 있어요.</p>
      <textarea ref={area} className="field export__json" readOnly value={json} rows={8} aria-label="내보낸 JSON" onFocus={(e) => e.currentTarget.select()} />
      <div className="newtopic__actions">
        <button type="button" className="btn btn--ghost" onClick={() => download(`molb-blankbook-${today()}.json`, json, 'application/json')}>
          파일로 받기
        </button>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            navigator.clipboard
              ?.writeText(json)
              .then(() => onNotice('복사했어요 — 메모장에 붙여 넣어 .json으로 저장해 두세요'))
              .catch(() => {
                area.current?.focus();
                area.current?.select();
                onNotice('복사가 막혀 있어요 — 칸의 글을 직접 골라 복사해요');
              });
          }}
        >
          복사하기
        </button>
      </div>
    </Dialog>
  );
}

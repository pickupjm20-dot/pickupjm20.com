/**
 * 블랭크북 — 내 글로 만드는 MolB 리더. 사이트에서 끝까지 쓰는 기능이고, 장부는 이 브라우저(localStorage)에 산다.
 *
 * 넓은 화면은 책장 · 책 · 단어장 세 칸, 좁은 화면은 같은 셋을 위의 탭으로 갈아 본다.
 */
import { useEffect, useState } from 'react';
import { ArrowLeft } from '../components/Icons';
import { Mascot } from '../components/Mascot';
import { ReviewOffBadge } from '../components/ReviewOffBadge';
import { BLANKBOOK_GUIDE } from '../sections/BlankBookTeaser';
import { loadDictionary, type Dictionary } from '../lib/dictionary';
import { download, readFileText, today } from '../lib/download';
import {
  addBook,
  addWord,
  deleteBook,
  EMPTY_LIBRARY,
  exportLibrary,
  mergeLibrary,
  recordQuiz,
  removeWord,
  sanitizeLibrary,
  updateBook,
  updateWord,
} from '../lib/library';
import { usePersistentState, useStorageHealth } from '../lib/storage';
import { BookEditor } from './blankbook/BookEditor';
import { BookView } from './blankbook/BookView';
import { SAMPLE_TEXT, SAMPLE_TITLE } from './blankbook/sample';
import { Shelf } from './blankbook/Shelf';
import { WordsPanel } from './blankbook/WordsPanel';

type Mode = 'read' | 'edit' | 'new';
type Tab = 'shelf' | 'book' | 'words';

export function BlankBookPage() {
  const [lib, setLib] = usePersistentState('library', EMPTY_LIBRARY, sanitizeLibrary);
  const [selected, setSelected] = usePersistentState<string | null>('blankbook.selected', null, (v) =>
    typeof v === 'string' ? v : null,
  );
  const [mode, setMode] = useState<Mode>('read');
  const [tab, setTab] = useState<Tab>('book');
  const [dict, setDict] = useState<Dictionary | null>(null);
  const [dictError, setDictError] = useState(false);
  const [notice, setNotice] = useState('');
  const storageOk = useStorageHealth();
  const [guideOpen, setGuideOpen] = useState(() => lib.books.length === 0);

  const book = lib.books.find((b) => b.id === selected) ?? null;

  useEffect(() => {
    let alive = true;
    loadDictionary()
      .then((d) => alive && setDict(d))
      .catch(() => alive && setDictError(true));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(''), 3200);
    return () => window.clearTimeout(t);
  }, [notice]);

  // 고른 책이 지워졌으면(다른 탭 · 가져오기) 첫 책으로.
  useEffect(() => {
    if (selected && !book) setSelected(lib.books[0]?.id ?? null);
  }, [selected, book, lib.books, setSelected]);

  const create = (title: string, text: string) => {
    const { lib: next, book: b } = addBook(lib, title, text);
    setLib(next);
    setSelected(b.id);
    setMode('read');
    setTab('book');
    setGuideOpen(false);
  };

  const onExport = () => {
    download(`molb-blankbook-${today()}.json`, exportLibrary(lib), 'application/json');
  };

  const onImport = async (file: File) => {
    try {
      const incoming = sanitizeLibrary(JSON.parse(await readFileText(file)));
      if (incoming.books.length === 0 && incoming.words.length === 0) {
        setNotice('가져올 책이나 단어가 없는 파일이에요.');
        return;
      }
      setLib((cur) => mergeLibrary(cur, incoming));
      setNotice(`책 ${incoming.books.length}권 · 단어 ${incoming.words.length}개를 합쳤어요.`);
    } catch {
      setNotice('블랭크북 내보내기 파일(JSON)이 아니에요.');
    }
  };

  const onClear = () => {
    if (!window.confirm('책과 단어장을 모두 지울까요? 되돌릴 수 없어요. 먼저 내보내기로 받아 두는 걸 권해요.')) return;
    setLib(EMPTY_LIBRARY);
    setSelected(null);
    setMode('new');
  };

  const onDeleteBook = () => {
    if (!book) return;
    if (!window.confirm(`‘${book.title}’을(를) 지울까요? 이 책에서 담은 단어는 단어장에 남아요.`)) return;
    setLib((cur) => deleteBook(cur, book.id));
    setSelected(lib.books.find((b) => b.id !== book.id)?.id ?? null);
  };

  const showEditor = mode === 'new' || !book;

  return (
    <div className="bb">
      <div className="container">
        <header className="bb__head">
          <a className="bb__back" href="#/">
            <ArrowLeft size={16} /> MolB World
          </a>
          <div className="bb__title-row">
            <img src={`${import.meta.env.BASE_URL}img/icons/notebook.webp`} alt="" width={56} height={56} />
            <div>
              <h1 className="bb__title">블랭크북</h1>
              <p className="bb__sub">
                내 글로 만드는 MolB 리더 · <span className="chip chip--growth">이 브라우저에 저장</span> <ReviewOffBadge />
              </p>
            </div>
            <button type="button" className="link-btn bb__guide-toggle" aria-expanded={guideOpen} onClick={() => setGuideOpen((v) => !v)}>
              {guideOpen ? '안내 접기' : '의도 · 쓰는 법 · 결과 보기'}
            </button>
          </div>
          {guideOpen && (
            <ol className="bb__guide">
              {BLANKBOOK_GUIDE.map((g) => (
                <li key={g.tag}>
                  <span className="guide__tag">{g.tag}</span>
                  <h2>{g.title}</h2>
                  <p>{g.body}</p>
                </li>
              ))}
            </ol>
          )}
        </header>

        <div className="seg bb__tabs" role="tablist" aria-label="블랭크북 화면">
          {(
            [
              ['shelf', `책장 ${lib.books.length}`],
              ['book', book && !showEditor ? '읽기' : '새 책'],
              ['words', `단어장 ${lib.words.length}`],
            ] as const
          ).map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>
              {label}
            </button>
          ))}
        </div>

        <div className={`bb__layout bb__layout--${tab}`}>
          <section className="bb__col bb__col--shelf" aria-label="책장">
            <Shelf
              lib={lib}
              selected={showEditor ? null : selected}
              onSelect={(id) => {
                setSelected(id);
                setMode('read');
                setTab('book');
              }}
              onNew={() => {
                setMode('new');
                setTab('book');
              }}
              onSample={() => create(SAMPLE_TITLE, SAMPLE_TEXT)}
              onExport={onExport}
              onImport={(f) => void onImport(f)}
              onClear={onClear}
              storageOk={storageOk}
            />
          </section>

          <section className="bb__col bb__col--book" aria-label={book && !showEditor ? book.title : '새 책'}>
            {showEditor ? (
              <div className="bb__new">
                <div className="bb__new-head">
                  <Mascot pose="writing" size={72} says="어떤 글 읽을 거야? 붙여 넣어 줘!" />
                </div>
                <BookEditor
                  key="new"
                  submitLabel="책 만들기"
                  onSubmit={create}
                  onCancel={book ? () => setMode('read') : undefined}
                />
                <p className="bb__note">
                  사이트에서는 붙여 넣기와 .txt만 열 수 있어요. 앱에서는 .pdf · .docx · 사진(OCR)도 열고, 내장 사전에 없는
                  낱말은 AI가 문맥의 뜻을 찾아 줘요.
                </p>
              </div>
            ) : mode === 'edit' ? (
              <BookEditor
                key={book.id}
                initialTitle={book.title}
                initialText={book.text}
                submitLabel="고친 내용 저장"
                onSubmit={(title, text) => {
                  setLib((cur) => updateBook(cur, book.id, { title, text }));
                  setMode('read');
                }}
                onCancel={() => setMode('read')}
              />
            ) : (
              <BookView
                book={book}
                words={lib.words}
                dict={dict}
                dictError={dictError}
                onCollect={(w) =>
                  setLib((cur) => addWord(cur, { ...w, bookId: book.id, from: book.title }))
                }
                onRemove={(id) => setLib((cur) => removeWord(cur, id))}
                onMeaning={(id, meaning) => setLib((cur) => updateWord(cur, id, { meaning }))}
                onEdit={() => setMode('edit')}
                onDelete={onDeleteBook}
              />
            )}
          </section>

          <section className="bb__col bb__col--words" aria-label="단어장">
            <WordsPanel
              key={book?.id ?? 'all'}
              words={lib.words}
              bookId={showEditor ? null : (book?.id ?? null)}
              bookTitle={book?.title ?? ''}
              onMeaning={(id, meaning) => setLib((cur) => updateWord(cur, id, { meaning }))}
              onRemove={(id) => setLib((cur) => removeWord(cur, id))}
              onQuizResult={(id, correct) => setLib((cur) => recordQuiz(cur, id, correct))}
            />
          </section>
        </div>
      </div>
      {notice && (
        <p className="toast" role="status">
          {notice}
        </p>
      )}
    </div>
  );
}

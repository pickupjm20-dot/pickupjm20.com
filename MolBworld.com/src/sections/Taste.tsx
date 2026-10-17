/**
 * 찍먹 — 앱의 리더를 지문 셋으로 그대로 해 본다.
 *
 * 톡(담기) · 꾹(보기만) · 해석 · '공부 끝!'의 학습 로그 · 뜻 적기 퀴즈까지. 풀이는 앱의 글 파일에 미리 적힌 것이라
 * AI 없이 앱과 같은 답이 뜬다. 지문마다의 기록(담은 낱말 · 본 낱말 · 끝냈는지)은 이 브라우저에 남는다.
 */
import { useMemo, useRef, useState } from 'react';
import { ArrowRight, CloseIcon, HandTapIcon, TranslateIcon } from '../components/Icons';
import { Mascot } from '../components/Mascot';
import { QuizRunner } from '../components/QuizRunner';
import { Reader, type Spot, type WordHit, type WordState } from '../components/Reader';
import { ReviewOffBadge } from '../components/ReviewOffBadge';
import { PASSAGES, type Passage } from '../data/passages';
import { asset, LINKS, type Pose } from '../data/site';
import { entryFor, phraseAt, readingFor, type GlossWord } from '../lib/gloss';
import { quickLemma } from '../lib/lemma';
import { addWord, sanitizeLibrary } from '../lib/library';
import { readJSON, usePersistentState, writeJSON } from '../lib/storage';
import { keyOf, markInSentence, type Sentence } from '../lib/text';

type Collected = { id: string; surface: string; meaning: string; sentence: string; korean: string; phrase: boolean };
type TasteRecord = { collected: Collected[]; peeked: string[]; finished: boolean };
type TasteStore = Record<string, TasteRecord>;

const EMPTY: TasteRecord = { collected: [], peeked: [], finished: false };

function sanitizeStore(raw: unknown): TasteStore {
  if (!raw || typeof raw !== 'object') return {};
  const out: TasteStore = {};
  for (const p of PASSAGES) {
    const r = (raw as Record<string, Partial<TasteRecord> | undefined>)[p.id];
    if (!r) continue;
    out[p.id] = {
      collected: Array.isArray(r.collected) ? r.collected.filter((c) => c && typeof c.id === 'string') : [],
      peeked: Array.isArray(r.peeked) ? r.peeked.filter((x) => typeof x === 'string') : [],
      finished: r.finished === true,
    };
  }
  return out;
}

/** 누른 자리의 풀이 — 글 파일에 적힌 뜻 · 사전형 · 숙어 · 문장 해석. */
type Gloss = {
  surface: string;
  lemma: string;
  meaning: string;
  korean: string;
  sentence: Sentence;
  tokenIndex: number;
  phrase: GlossWord | undefined;
};

function glossOf(p: Passage, hit: WordHit): Gloss {
  const reading = readingFor(p.byText, p.readings, hit.sentence);
  const entry = entryFor(reading, hit.token.text);
  return {
    surface: hit.token.text,
    lemma: entry ? keyOf(entry.lemma) : quickLemma(hit.token.text),
    meaning: entry?.meaning ?? '',
    korean: reading?.korean ?? '',
    sentence: hit.sentence,
    tokenIndex: hit.tokenIndex,
    phrase: phraseAt(reading, hit.sentence, hit.tokenIndex),
  };
}

/** 그냥 읽고 지나간 낱말을 고를 때 빼는 기능어 — 앱의 `utils/stopwords.dart`를 줄인 것. */
const STOP = new Set(
  'a an the and or but if of to in on at by for with from up as is am are was were be been do does did you your i my me we our he she it its they them their this that these those can will not no so than then there here what when who how'.split(
    ' ',
  ),
);

type Line = { pose: Pose; text: string };

const START: Line = { pose: 'reading', text: '모르는 단어만 톡 눌러 줘! 아는 건 그냥 지나가도 돼.' };

export function Taste() {
  const [store, setStore] = usePersistentState<TasteStore>('taste', {}, sanitizeStore);
  const [pid, setPid] = useState(PASSAGES[0]!.id);
  const passage = PASSAGES.find((p) => p.id === pid) ?? PASSAGES[0]!;
  const rec = store[passage.id] ?? EMPTY;
  const [active, setActive] = useState<{ spot: Spot; gloss: Gloss; kind: 'tap' | 'peek' } | null>(null);
  const [showTr, setShowTr] = useState(false);
  const [line, setLine] = useState<Line>(START);
  const [quiz, setQuiz] = useState(false);
  const [moved, setMoved] = useState<number | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const update = (fn: (r: TasteRecord) => TasteRecord) =>
    setStore((s) => ({ ...s, [passage.id]: fn(s[passage.id] ?? EMPTY) }));

  const collectedIds = useMemo(() => new Set(rec.collected.map((c) => c.id)), [rec.collected]);
  const peekedIds = useMemo(() => new Set(rec.peeked), [rec.peeked]);

  // 낱말마다의 사전형 · 덮는 숙어 — 형광펜을 같은 낱말의 다른 자리에도 칠하려고.
  const tokenInfo = useMemo(() => {
    const m = new Map<string, { lemma: string; phrase: string | null }>();
    for (const para of passage.doc.paragraphs) {
      for (const s of para.sentences) {
        const reading = readingFor(passage.byText, passage.readings, s);
        s.tokens.forEach((t, ti) => {
          if (!t.word) return;
          const e = entryFor(reading, t.text);
          const ph = phraseAt(reading, s, ti);
          m.set(`${s.index}:${ti}`, { lemma: e ? keyOf(e.lemma) : '', phrase: ph ? keyOf(ph.lemma) : null });
        });
      }
    }
    return m;
  }, [passage]);

  const wordState = (_t: unknown, s: Sentence, ti: number): WordState => {
    const info = tokenInfo.get(`${s.index}:${ti}`);
    if (!info) return null;
    if ((info.lemma && collectedIds.has(info.lemma)) || (info.phrase && collectedIds.has(info.phrase))) return 'marked';
    if (info.lemma && peekedIds.has(info.lemma)) return 'peeked';
    return null;
  };

  const choose = (id: string) => {
    setPid(id);
    setActive(null);
    setShowTr(false);
    setQuiz(false);
    setMoved(null);
    setLine(START);
  };

  const onTap = (hit: WordHit) => {
    const g = glossOf(passage, hit);
    setActive({ spot: { s: hit.sentence.index, t: hit.tokenIndex }, gloss: g, kind: 'tap' });
    if (!g.meaning) {
      setLine({ pose: 'observing', text: '어? 이 낱말은 풀이가 안 적혀 있네. 이름이나 관사 같은 거야.' });
      return;
    }
    if (collectedIds.has(g.lemma)) {
      setLine({ pose: 'smiling', text: `‘${g.lemma}’는 벌써 담았어! 형광펜 보이지?` });
      return;
    }
    update((r) => ({
      ...r,
      collected: [
        ...r.collected,
        { id: g.lemma, surface: g.surface, meaning: g.meaning, sentence: g.sentence.text, korean: g.korean, phrase: false },
      ],
      peeked: r.peeked.filter((x) => x !== g.lemma),
    }));
    setLine({ pose: 'dance', text: `헐, ‘${g.lemma}’ 담았다! 형광펜 칠해 둘게.` });
  };

  const onPeek = (hit: WordHit) => {
    const g = glossOf(passage, hit);
    setActive({ spot: { s: hit.sentence.index, t: hit.tokenIndex }, gloss: g, kind: 'peek' });
    if (!g.meaning) return;
    if (!collectedIds.has(g.lemma) && !peekedIds.has(g.lemma)) {
      update((r) => ({ ...r, peeked: [...r.peeked, g.lemma] }));
    }
    setLine({ pose: 'observing', text: '꾹 누르면 보기만 하는 거야. 단어장엔 안 넣을게!' });
  };

  const remove = (id: string) => {
    update((r) => ({ ...r, collected: r.collected.filter((c) => c.id !== id) }));
    setLine({ pose: 'smiling', text: '앗, 뺄게! 아는 단어였구나.' });
  };

  const collectPhrase = (g: Gloss) => {
    if (!g.phrase) return;
    const id = keyOf(g.phrase.lemma);
    if (collectedIds.has(id)) return;
    update((r) => ({
      ...r,
      collected: [
        ...r.collected,
        { id, surface: g.phrase!.word, meaning: g.phrase!.meaning, sentence: g.sentence.text, korean: g.korean, phrase: true },
      ],
    }));
    setLine({ pose: 'dance', text: `덩어리째 ‘${id}’ 담았어! 이게 진짜 꿀팁이지.` });
  };

  const finish = () => {
    update((r) => ({ ...r, finished: true }));
    setActive(null);
    setLine({ pose: 'dance', text: '오늘 한 편 끝! 대박, 나 방에 뭐 생기는 거야?' });
    requestAnimationFrame(() => logRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const restart = () => {
    update(() => EMPTY);
    setQuiz(false);
    setMoved(null);
    setActive(null);
    setLine(START);
  };

  const moveToLibrary = () => {
    let lib = sanitizeLibrary(readJSON('library', null));
    const before = lib.words.length;
    for (const c of rec.collected) {
      lib = addWord(lib, {
        id: c.id,
        surface: c.surface,
        meaning: c.meaning,
        sentence: c.sentence,
        bookId: null,
        from: `찍먹 · ${passage.title}`,
      });
    }
    writeJSON('library', lib);
    setMoved(lib.words.length - before);
  };

  const step = rec.finished ? 3 : rec.collected.length + rec.peeked.length > 0 ? 2 : 1;

  return (
    <section id="taste" className="section taste" aria-labelledby="taste-title">
      <div className="container">
        <header className="section__head" data-reveal>
          <p className="kicker">01 · 찍먹</p>
          <h2 id="taste-title" className="section__title">
            지문 셋으로 <em>MolB 찍먹</em>
          </h2>
          <p className="section__lead">
            앱의 리더를 그대로 옮겨 왔어요. 지문은 앱에 실린 글이고, 낱말 풀이와 문장 해석도 앱에 미리 적힌 그대로예요.
            로그인 · AI 없이 바로.
          </p>
        </header>

        <div className="passage-picker" role="tablist" aria-label="찍먹 지문 고르기" data-reveal>
          {PASSAGES.map((p, i) => {
            const r = store[p.id];
            return (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={p.id === passage.id}
                aria-controls="taste-panel"
                className={`passage-card${p.id === passage.id ? ' is-on' : ''}`}
                onClick={() => choose(p.id)}
              >
                <img src={asset(`img/passages/${p.image}`)} alt="" width={300} height={225} loading="lazy" />
                <span className="passage-card__body">
                  <span className="passage-card__meta">
                    <span className={`level level--${i}`}>{p.level}</span>
                    {p.band} · {p.minutes}분
                    {r?.finished && <span className="passage-card__done">읽음</span>}
                  </span>
                  <span className="passage-card__title">{p.title}</span>
                  <span className="passage-card__intent">{p.intent}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div id="taste-panel" className="taste__grid" role="tabpanel" aria-label={passage.title}>
          <aside className="guide" aria-label="찍먹 안내">
            <ol className="guide__steps">
              <li className={`guide__step${step === 1 ? ' is-now' : step > 1 ? ' is-done' : ''}`}>
                <span className="guide__tag">의도</span>
                <p>
                  외우지 않고 <b>읽다가 막힌 단어만</b> 모아요. 글 한 편이 단어 몇 개를 남기고, 그 단어는 내가 읽은 문장과
                  함께 기억돼요.
                </p>
              </li>
              <li className={`guide__step${step === 2 ? ' is-now' : step > 2 ? ' is-done' : ''}`}>
                <span className="guide__tag">쓰는 법</span>
                <ul>
                  <li>
                    모르는 단어는 <b>톡</b> — 뜻 · 문장 해석이 뜨고 담겨요
                  </li>
                  <li>
                    아는데 헷갈리면 <b>꾹</b>(길게) — 보기만 해요
                  </li>
                  <li>
                    막히면 <b>해석</b>, 다 읽으면 <b>공부 끝!</b>
                  </li>
                </ul>
              </li>
              <li className={`guide__step${step === 3 ? ' is-now' : ''}`}>
                <span className="guide__tag">결과</span>
                <p>
                  AI 없이 방금 누른 기록만으로 <b>학습 로그</b>(담은 · 헷갈린 · 그냥 읽은 단어)와 <b>뜻 적기 퀴즈</b>.
                  앱이라면 담은 단어가 몰비 방의 물건이 돼요.
                </p>
              </li>
            </ol>
          </aside>

          <div className="reader-panel">
            <div className="reader-panel__head">
              <div>
                <p className="reader-panel__meta">
                  오늘의 글 · {passage.topic} · {passage.band} · {passage.minutes}분
                </p>
                <h3 className="reader-panel__title">{passage.title}</h3>
              </div>
              <button
                type="button"
                className={`pill-btn${showTr ? ' is-on' : ''}`}
                aria-pressed={showTr}
                onClick={() => {
                  setShowTr((v) => !v);
                  if (!showTr) setLine({ pose: 'observing', text: '해석은 막힐 때만 살짝 보기! 약속~' });
                }}
              >
                <TranslateIcon size={16} /> 해석
              </button>
            </div>
            <p className="reader-panel__tip">
              <HandTapIcon size={16} /> 모르는 단어는 <b>톡</b> · 헷갈리면 <b>꾹</b>
            </p>
            <Reader
              label={passage.title}
              doc={passage.doc}
              wordState={wordState}
              active={active?.spot ?? null}
              onTap={onTap}
              onPeek={onPeek}
              showTranslation={showTr}
              translationFor={(para) =>
                para.sentences
                  .map((s) => readingFor(passage.byText, passage.readings, s)?.korean ?? '')
                  .filter(Boolean)
                  .join(' ')
              }
              figure={
                <figure className="reader__figure">
                  <img src={asset(`img/passages/${passage.image}`)} alt="" width={900} height={675} loading="lazy" />
                </figure>
              }
            />
            {active && (
              <div className="reader-panel__dock">
                <GlossCard
                  gloss={active.gloss}
                  kind={active.kind}
                  collected={collectedIds.has(active.gloss.lemma)}
                  phraseCollected={active.gloss.phrase ? collectedIds.has(keyOf(active.gloss.phrase.lemma)) : false}
                  onRemove={() => remove(active.gloss.lemma)}
                  onCollect={() =>
                    onTap({
                      sentence: active.gloss.sentence,
                      tokenIndex: active.gloss.tokenIndex,
                      token: active.gloss.sentence.tokens[active.gloss.tokenIndex]!,
                    })
                  }
                  onCollectPhrase={() => collectPhrase(active.gloss)}
                  onClose={() => setActive(null)}
                />
              </div>
            )}
            <div className="reader-panel__end">
              {rec.finished ? (
                <button type="button" className="btn btn--ghost" onClick={restart}>
                  처음부터 다시 읽기
                </button>
              ) : (
                <button type="button" className="btn btn--growth btn--lg" onClick={finish}>
                  <img src={asset('img/icons/acorn.webp')} alt="" width={24} height={24} /> 공부 끝!
                </button>
              )}
              <span className="reader-panel__count">
                담은 단어 {rec.collected.length} · 꾹 {rec.peeked.length}
              </span>
            </div>
          </div>

          <aside className="tray" aria-label="담은 단어">
            <Mascot pose={line.pose} says={line.text} size={88} className="tray__mascot" bubbleSide="right" />
            <div className="tray__card">
              <div className="tray__head">
                <h3>
                  담은 단어 <span className="tray__n">{rec.collected.length}</span>
                </h3>
                <ReviewOffBadge align="right" />
              </div>
              {rec.collected.length === 0 ? (
                <p className="tray__empty">아직 없어요. 본문에서 모르는 단어를 톡 눌러 보세요.</p>
              ) : (
                <ul className="tray__list">
                  {rec.collected.map((c) => (
                    <li key={c.id}>
                      <span className="tray__word">
                        {c.id}
                        {c.phrase && <span className="chip chip--reading">숙어</span>}
                      </span>
                      <span className="tray__meaning">{c.meaning}</span>
                      <button
                        type="button"
                        className="icon-btn icon-btn--sm"
                        aria-label={`${c.id} 빼기`}
                        onClick={() => remove(c.id)}
                      >
                        <CloseIcon size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="tray__note">
                앱에서는 이 단어들이 단어장에 들어가 낱말마다 복습할 날이 잡혀요. 여기서는 모아 두기까지만.
              </p>
            </div>
          </aside>
        </div>

        {rec.finished && (
          <div className="study-log" ref={logRef} aria-labelledby="study-log-title">
            <StudyLog
              passage={passage}
              rec={rec}
              tokenInfo={tokenInfo}
              quiz={quiz}
              onQuiz={setQuiz}
              moved={moved}
              onMove={moveToLibrary}
              onNext={() => {
                const i = PASSAGES.findIndex((p) => p.id === passage.id);
                choose(PASSAGES[(i + 1) % PASSAGES.length]!.id);
                document.getElementById('taste')?.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          </div>
        )}
      </div>
    </section>
  );
}

function GlossCard({
  gloss,
  kind,
  collected,
  phraseCollected,
  onRemove,
  onCollect,
  onCollectPhrase,
  onClose,
}: {
  gloss: Gloss;
  kind: 'tap' | 'peek';
  collected: boolean;
  phraseCollected: boolean;
  onRemove: () => void;
  onCollect: () => void;
  onCollectPhrase: () => void;
  onClose: () => void;
}) {
  const m = markInSentence(gloss.sentence, gloss.tokenIndex);
  const swapped = gloss.meaning && gloss.lemma !== keyOf(gloss.surface);
  return (
    <div className="wcard" role="dialog" aria-label={`${gloss.surface} 풀이`}>
      <div className="wcard__top">
        <p className="wcard__head">
          <strong>{gloss.surface}</strong>
          {gloss.meaning ? <> · {gloss.meaning}</> : <span className="wcard__none"> · 미리 적은 풀이가 없어요</span>}
        </p>
        <button type="button" className="icon-btn icon-btn--sm" aria-label="풀이 닫기" onClick={onClose}>
          <CloseIcon size={16} />
        </button>
      </div>
      <div className="wcard__chips">
        {swapped && <span className="chip">원형 {gloss.lemma}</span>}
        {gloss.meaning &&
          (collected ? (
            <span className="chip chip--growth">단어장에 담았어요</span>
          ) : kind === 'peek' ? (
            <span className="chip chip--action">꾹 · 보기만 했어요</span>
          ) : null)}
      </div>
      <p className="wcard__sentence">
        {m.before}
        <b>{m.word}</b>
        {m.after}
      </p>
      {gloss.korean && <p className="wcard__korean">{gloss.korean}</p>}
      {gloss.phrase && (
        <p className="wcard__phrase">
          <span className="chip chip--reading">숙어</span> <b>{gloss.phrase.lemma}</b> {gloss.phrase.meaning}
          {!phraseCollected && (
            <button type="button" className="link-btn" onClick={onCollectPhrase}>
              덩어리째 담기
            </button>
          )}
        </p>
      )}
      {!gloss.meaning && (
        <p className="wcard__hint">이름 · 관사처럼 풀이를 따로 적지 않은 낱말이에요. 앱에서는 이럴 때 AI가 문맥의 뜻을 찾아 줘요.</p>
      )}
      {gloss.meaning && (
        <div className="wcard__actions">
          {collected ? (
            <button type="button" className="link-btn" onClick={onRemove}>
              아는 단어였어요 — 빼기
            </button>
          ) : (
            <button type="button" className="link-btn" onClick={onCollect}>
              그래도 담을래요
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function StudyLog({
  passage,
  rec,
  tokenInfo,
  quiz,
  onQuiz,
  moved,
  onMove,
  onNext,
}: {
  passage: Passage;
  rec: TasteRecord;
  tokenInfo: Map<string, { lemma: string; phrase: string | null }>;
  quiz: boolean;
  onQuiz: (v: boolean) => void;
  moved: number | null;
  onMove: () => void;
  onNext: () => void;
}) {
  const collected = new Set(rec.collected.map((c) => c.id));
  const peeked = rec.peeked.filter((p) => !collected.has(p));
  const easy = new Set<string>();
  for (const { lemma } of tokenInfo.values()) {
    if (!lemma || STOP.has(lemma) || collected.has(lemma) || peeked.includes(lemma) || lemma.length < 3) continue;
    easy.add(lemma);
  }
  const easyList = [...easy];

  const meaningOf = (lemma: string) => {
    for (const para of passage.doc.paragraphs) {
      for (const s of para.sentences) {
        const e = entryFor(readingFor(passage.byText, passage.readings, s), lemma);
        if (e) return e.meaning;
      }
    }
    return '';
  };

  return (
    <>
      <div className="study-log__head">
        <Mascot pose="dance" size={96} />
        <div>
          <p className="kicker">공부 끝! · {passage.title}</p>
          <h3 id="study-log-title" className="study-log__title">
            오늘의 학습 로그
          </h3>
          <p className="study-log__sub">AI의 판단이 아니라, 방금 누른 기록만 봤어요 — 앱의 ‘공부 끝!’과 같은 방식이에요.</p>
        </div>
      </div>

      <div className="study-log__cols">
        <div className="log-col log-col--hard">
          <h4>
            어려웠던 단어 <span>{rec.collected.length}</span>
          </h4>
          <p className="log-col__why">톡 눌러 담은 단어</p>
          {rec.collected.length ? (
            <ul>
              {rec.collected.map((c) => (
                <li key={c.id}>
                  <b>{c.id}</b> {c.meaning}
                </li>
              ))}
            </ul>
          ) : (
            <p className="log-col__empty">하나도 안 눌렀어요. 이 지문은 쉬웠나 봐요!</p>
          )}
        </div>
        <div className="log-col log-col--peek">
          <h4>
            헷갈린 단어 <span>{peeked.length}</span>
          </h4>
          <p className="log-col__why">꾹 눌러 보기만 한 단어</p>
          {peeked.length ? (
            <ul>
              {peeked.map((p) => (
                <li key={p}>
                  <b>{p}</b> {meaningOf(p)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="log-col__empty">꾹 눌러 본 단어가 없어요.</p>
          )}
        </div>
        <div className="log-col log-col--easy">
          <h4>
            쉽게 읽은 단어 <span>{easyList.length}</span>
          </h4>
          <p className="log-col__why">누르지 않고 지나간 단어</p>
          <p className="log-col__chips">
            {easyList.slice(0, 14).map((e) => (
              <span key={e} className="chip">
                {e}
              </span>
            ))}
            {easyList.length > 14 && <span className="chip chip--faint">+{easyList.length - 14}</span>}
          </p>
        </div>
      </div>

      <div className="study-log__app">
        <img src={asset('img/world/room-stage3.webp')} alt="" width={120} height={267} loading="lazy" />
        <p>
          <b>앱이었다면</b> — 담은 단어 {rec.collected.length}개가 단어장에 들어가 FSRS-6가 복습할 날을 잡고, 익힌
          단어는 몰비의 방에 물건으로 와요. 너무 쉽게 넘어간 단어는 이 글의 문장으로 문맥 퀴즈를 내요.
        </p>
      </div>

      {quiz ? (
        <QuizRunner
          title="담은 단어로 뜻 적기"
          items={rec.collected.map((c) => ({ id: c.id, word: c.id, meaning: c.meaning, sentence: c.sentence }))}
          onClose={() => onQuiz(false)}
        />
      ) : (
        <div className="study-log__actions">
          <button
            type="button"
            className="btn btn--primary"
            disabled={rec.collected.length === 0}
            onClick={() => onQuiz(true)}
          >
            담은 단어로 뜻 적기 퀴즈
          </button>
          <button type="button" className="btn btn--outline" disabled={rec.collected.length === 0} onClick={onMove}>
            블랭크북 단어장으로 옮기기
          </button>
          <button type="button" className="btn btn--ghost" onClick={onNext}>
            다음 지문 <ArrowRight size={16} />
          </button>
          <ReviewOffBadge />
        </div>
      )}
      {moved != null && (
        <p className="study-log__moved" role="status">
          {moved > 0 ? `${moved}개를 옮겼어요.` : '이미 다 옮겨져 있어요.'} <a href="#/blankbook">블랭크북에서 보기</a>
          {' · '}
          <a href={LINKS.play} target="_blank" rel="noopener noreferrer">
            앱에서 이어 하기
          </a>
        </p>
      )}
    </>
  );
}

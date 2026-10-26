/**
 * 영어만이 아니에요 — 자격증 · 학교 공부도. 앱의 방향(FOLLOW_UP 135 · 136 · 138): 단어장은 태그로 갈리고, 우리말 용어는 뜻 · 정의를 들고 담기고,
 * 빈칸 퀴즈가 용어를 떠올리게 하고, 복습할 단어가 마을에 몽타주 · 신문 · 전단지 · 쪽지 시험으로 붙는다. PDF 교재는 책으로 열어 담을 단어장을
 * 고르고, 주제 · 핵심 용어를 정리해 리더의 목표 칸에 둔다.
 *
 * 앱의 마을 화면 사진이 아직 없어서(1.4.0) 인쇄물은 앱의 틀(`world_print_sheet.dart`)을 따라 CSS로 그렸다. 몽타주는 실제로 풀 수 있다.
 */
import { useState } from 'react';
import { ArrowRight } from '../components/Icons';
import { asset } from '../data/site';
import { isCorrectAnswer } from '../lib/blank/quiz';

type Word = { word: string; meaning: string; sentence: string; source: string };
type Subject = { tag: string; kind: string; sample: string; words: [Word, Word, Word] };

const SUBJECTS: Subject[] = [
  {
    tag: '정보처리기사',
    kind: '자격증',
    sample: 'db',
    words: [
      { word: '정규화', meaning: '테이블을 나누어 데이터의 중복을 줄이고 이상 현상을 막는 과정', sentence: '정규화는 테이블을 나누어 데이터의 중복을 줄인다.', source: 'PDF 공부 · 데이터베이스 요약' },
      { word: '트랜잭션', meaning: '한꺼번에 수행되어야 하는 작업의 단위', sentence: '트랜잭션은 원자성 · 일관성 · 독립성 · 지속성을 지켜야 한다.', source: '붙여 넣은 목록' },
      { word: '기본키', meaning: '테이블에서 각 행을 하나로 구별하는 키', sentence: '기본키는 중복되거나 비어 있을 수 없다.', source: '붙여 넣은 목록' },
    ],
  },
  {
    tag: '한국사',
    kind: '자격증',
    sample: 'history',
    words: [
      { word: '훈민정음', meaning: '세종이 창제한, 백성을 가르치는 바른 소리', sentence: '훈민정음은 1446년에 반포되었다.', source: 'PDF 공부 · 조선 전기' },
      { word: '경국대전', meaning: '세조 때 편찬을 시작해 성종 때 완성된 조선의 기본 법전', sentence: '경국대전은 성종 때 완성되었다.', source: '붙여 넣은 목록' },
      { word: '균역법', meaning: '영조 때 군포를 2필에서 1필로 줄인 제도', sentence: '균역법으로 백성의 군포 부담이 줄었다.', source: '붙여 넣은 목록' },
    ],
  },
  {
    tag: '생명과학',
    kind: '학교 공부',
    sample: 'bio',
    words: [
      { word: '광합성', meaning: '빛 에너지로 이산화 탄소와 물에서 포도당을 만드는 과정', sentence: '광합성은 엽록체에서 일어난다.', source: '교과서 3단원' },
      { word: '미토콘드리아', meaning: '세포 호흡이 주로 일어나는 세포 소기관', sentence: '미토콘드리아에서 ATP가 만들어진다.', source: '교과서 3단원' },
      { word: '엽록체', meaning: '광합성이 일어나는 식물 세포의 소기관', sentence: '엽록체에는 엽록소가 들어 있다.', source: '수업 필기' },
    ],
  },
  {
    tag: '영어',
    kind: '영어',
    sample: 'toeic',
    words: [
      { word: 'submit', meaning: '제출하다', sentence: 'Please submit your report by Friday.', source: '리더 · 오늘의 토익' },
      { word: 'postpone', meaning: '미루다, 연기하다', sentence: 'We had to postpone the meeting.', source: '리더 · 읽을거리' },
      { word: 'acorn', meaning: '도토리', sentence: 'The squirrel buried an acorn.', source: '리더 · 다람쥐가 잊어버린 도토리' },
    ],
  },
];

const FEATURES = [
  { title: '태그로 나누는 단어장', body: '자격증 · 과목마다 태그를 만들고, 고른 태그가 새 낱말의 기본 단어장이 돼요. 영어도 태그 하나예요.' },
  { title: '‘낱말 — 뜻’ 붙여 넣기', body: '교재 · 강의 자료 · AI가 뽑아 준 용어 목록을 한 번에. 줄표 · 쌍점 · 탭 · 등호 · 화살표로 가르면 돼요.' },
  { title: '빈칸 퀴즈', body: '뜻이나 문맥을 보고 용어를 쳐요. 우리말 용어는 조사는 남기고 어간만 가려요 — "____은 엽록체에서…"' },
  { title: 'PDF 교재로 공부', body: '교재 PDF를 책으로 열어 담을 단어장을 고르고, 주제 · 핵심 용어로 정리해 리더의 목표 칸에 둬요.' },
];

/** 한글 낱말은 어절의 머리에서 찾아 그 자리만 가린다(조사는 남긴다) — 앱의 ClozeSentence와 같은 꼴. */
function cloze(sentence: string, word: string): { before: string; after: string; particle: string } {
  let at = sentence.indexOf(word);
  while (at > 0 && /[가-힣]/.test(sentence[at - 1] ?? '')) at = sentence.indexOf(word, at + 1);
  if (at < 0) return { before: sentence, after: '', particle: '' };
  const after = sentence.slice(at + word.length);
  const particle = /^[가-힣]+/.exec(after)?.[0] ?? '';
  return { before: sentence.slice(0, at), after, particle };
}

const silhouette = (w: string) => `? ${[...w].length}글자`;

export function Study() {
  const [pick, setPick] = useState(0);
  const subject = SUBJECTS[pick]!;
  const [wanted, news, quiz] = subject.words;

  return (
    <section id="study" className="section study-sec" aria-labelledby="study-title">
      <div className="container">
        <header className="section__head" data-reveal>
          <p className="kicker">무엇을 공부하나요</p>
          <h2 id="study-title" className="section__title">
            영어만이 아니에요 — <em>자격증 · 학교 공부</em>도
          </h2>
          <p className="section__lead">
            MolB의 단어장은 태그로 갈려요. 토익 단어 옆에 정보처리기사 용어, 한국사 사건, 생명과학 개념을 나란히 두고, 무엇이든 같은 방식으로
            복습해요. 과목을 골라 보세요.
          </p>
        </header>

        <div className="subject-tabs" role="tablist" aria-label="과목 고르기" data-reveal>
          {SUBJECTS.map((s, i) => (
            <button key={s.tag} type="button" role="tab" aria-selected={i === pick} className={`subject-tab${i === pick ? ' is-on' : ''}`} onClick={() => setPick(i)}>
              <span className="subject-tab__kind">{s.kind}</span>#{s.tag}
            </button>
          ))}
        </div>

        <div className="study-sec__grid">
          <ul className="study-feats" data-reveal>
            {FEATURES.map((f, i) => (
              <li key={f.title}>
                <span className="study-feats__n">{i + 1}</span>
                <div>
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                </div>
              </li>
            ))}
            <li className="study-feats__cta">
              <img src={asset('img/icons/review_quiz.webp')} alt="" width={56} height={56} loading="lazy" />
              <div>
                <p>
                  사이트에서는 <b>블랭크북</b>으로 #{subject.tag} 빈칸 공부를 바로 해 볼 수 있어요.
                </p>
                <a className="btn btn--primary btn--sm" href={`#/blankbook/sample/${subject.sample}`}>
                  #{subject.tag} 예시로 맞춰 보기 <ArrowRight size={16} />
                </a>
              </div>
            </li>
          </ul>

          <div className="village-board" aria-label={`#${subject.tag} 단어로 마을에 붙은 것`} data-reveal>
            <p className="village-board__label">📌 오늘 마을에 붙은 것 · 복습할 낱말로</p>
            <Wanted key={`${subject.tag}-w`} word={wanted} tag={subject.tag} />
            <div className="village-board__row">
              <Newspaper word={news} />
              <PopQuiz words={subject.words} quiz={quiz} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** 🔍 몽타주(경찰서) — WANTED · 특징 = 뜻 · 마지막 목격 = 출처 · 목격담 = 문맥의 빈칸 · 실루엣 = 글자 수 · 신고하기 → 체포! */
function Wanted({ word, tag }: { word: Word; tag: string }) {
  const [typed, setTyped] = useState('');
  const [result, setResult] = useState<null | boolean>(null);
  const c = cloze(word.sentence, word.word);
  return (
    <article className={`wanted${result === true ? ' is-caught' : ''}`}>
      <p className="wanted__head">WANTED</p>
      <p className="wanted__station">경찰서 · 바클리 경관 · #{tag}</p>
      <div className="wanted__face" aria-hidden="true">
        {result === true ? word.word : silhouette(word.word)}
      </div>
      <dl className="wanted__facts">
        <div>
          <dt>특징</dt>
          <dd>{word.meaning}</dd>
        </div>
        <div>
          <dt>마지막 목격</dt>
          <dd>{word.source}</dd>
        </div>
        <div>
          <dt>목격담</dt>
          <dd>
            “{c.before}
            <span className="wanted__gap">{result === true ? word.word : '＿'.repeat(Math.min(5, [...word.word].length))}</span>
            {c.after}”
          </dd>
        </div>
      </dl>
      <p className="wanted__bounty">현상금 🌰 10</p>
      <form
        className="wanted__form"
        onSubmit={(e) => {
          e.preventDefault();
          if (result === true) return;
          setResult(isCorrectAnswer(typed, { answer: word.word, particle: c.particle }));
        }}
      >
        <label className="sr-only" htmlFor="wanted-input">
          몽타주의 낱말
        </label>
        <input
          id="wanted-input"
          className="field field--sm"
          value={typed}
          onChange={(e) => {
            setTyped(e.target.value);
            if (result === false) setResult(null);
          }}
          placeholder="이 낱말은? 쳐서 신고하기"
          autoComplete="off"
          disabled={result === true}
        />
        <button type="submit" className="btn btn--primary btn--sm" disabled={result === true}>
          신고하기
        </button>
      </form>
      {result != null && (
        <p className={`wanted__result ${result ? 'ok' : 'bad'}`} role="status">
          {result ? `체포! ${word.word}` : '놓쳤다… 다시 쳐 봐요'}
        </p>
      )}
    </article>
  );
}

/** 🗞️ 신문(조약돌 책방) — Acorn Village Daily · 날짜 · 날씨 · 머리기사 · 오늘의 낱말 기사 칸. */
function Newspaper({ word }: { word: Word }) {
  const d = new Date();
  return (
    <article className="paper">
      <p className="paper__name">Acorn Village Daily</p>
      <p className="paper__date">
        {d.getFullYear()}년 {d.getMonth() + 1}월 {d.getDate()}일 · 맑음 · 도토리 마을
      </p>
      <p className="paper__lead">도토리 빵집의 작은 세일</p>
      <p className="paper__lead-en">A little sale at Acorn Bakery</p>
      <div className="paper__word">
        <span>오늘의 낱말</span>
        <b>{word.word}</b>
        <p>{word.meaning}</p>
      </div>
    </article>
  );
}

/** 📝 쪽지 시험(마을 학교) — 그 태그의 빈칸. */
function PopQuiz({ words, quiz }: { words: Word[]; quiz: Word }) {
  return (
    <article className="popquiz">
      <p className="popquiz__head">📝 쪽지 시험 · 마을 학교</p>
      <ol>
        {[quiz, ...words.filter((w) => w !== quiz)].slice(0, 3).map((w) => {
          const c = cloze(w.sentence, w.word);
          return (
            <li key={w.word}>
              {c.before}
              <span className="popquiz__blank">{'＿'.repeat(Math.min(4, [...w.word].length))}</span>
              {c.after}
            </li>
          );
        })}
      </ol>
    </article>
  );
}

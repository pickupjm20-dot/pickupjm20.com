import { ArrowRight } from '../components/Icons';
import { ReviewOffBadge } from '../components/ReviewOffBadge';

/** 블랭크북의 의도 · 쓰는 법 · 결과 — 홈의 소개와 블랭크북 쪽이 같이 쓴다. */
export const BLANKBOOK_GUIDE = [
  {
    tag: '의도',
    title: '정의와 용어를 외워야 할 때',
    body: '자격증 · 학교 시험처럼 개념을 정확한 말로 떠올려야 하는 공부. 개념을 필기해 두고, 외울 말만 지워서 쳐서 채워요.',
  },
  {
    tag: '쓰는 법',
    title: '필기하고, "따옴표", 맞춰 보기',
    body: '학습주제(책)를 만들고 주제 카드에 제목 · 내용을 적어요. 외울 말은 "큰따옴표"로 감싸거나 칠하기로 눌러요. ChatGPT · Claude · Gemini로 만든 자료를 붙여 넣어도 돼요.',
  },
  {
    tag: '결과',
    title: '틀린 글자까지 보이는 빈칸 타자',
    body: '정답 · 내 답의 글자 차이, 걸린 시간과 타/분, 틀린 것만 다시. 맞힌 빈칸이 쌓여 내 타자 등급(🌰 도토리 → 👑 날다람쥐)이 올라요. 전부 이 브라우저에.',
  },
];

export function BlankBookTeaser() {
  return (
    <section id="blankbook-intro" className="section bb-teaser" aria-labelledby="bb-teaser-title">
      <div className="container bb-teaser__grid">
        <div className="bb-teaser__copy" data-reveal>
          <p className="kicker">02 · 블랭크북</p>
          <h2 id="bb-teaser-title" className="section__title">
            외울 말을 지우고, <em>쳐서 채우는</em> 빈 책
          </h2>
          <p className="section__lead">
            찍먹이 앱의 영어 리더를 맛보는 거라면, 블랭크북은 사이트에서 끝까지 쓰는 공부 도구예요. 학교 공부 · 자격증 · 영어 무엇이든 — 책과
            기록은 이 브라우저에 저장돼서 로그인이 필요 없어요.
          </p>
          <ol className="mini-guide">
            {BLANKBOOK_GUIDE.map((g) => (
              <li key={g.tag}>
                <span className="guide__tag">{g.tag}</span>
                <div>
                  <h3>{g.title}</h3>
                  <p>{g.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="bb-teaser__cta">
            <a className="btn btn--primary btn--lg" href="#/blankbook">
              블랭크북 펼치기 <ArrowRight size={18} />
            </a>
            <a className="btn btn--outline btn--lg" href="#/blankbook/sample/bio">
              예시로 바로 맞춰 보기
            </a>
            <ReviewOffBadge />
          </div>
        </div>

        <div className="quiz-mock" aria-hidden="true" data-reveal>
          <div className="quiz-mock__bar">
            <span>
              진행 <b>2</b>/4 · 맞음 <b className="ok">1</b> · 틀림 <b className="bad">0</b>
            </span>
            <span className="quiz-mock__toggle">☐ 띄어쓰기 무시</span>
          </div>
          <div className="quiz-mock__card">
            <p className="quiz-mock__topic">주제</p>
            <p className="quiz-mock__title">광합성</p>
            <p className="quiz-mock__text">
              <span className="quiz-mock__reveal">광합성</span>은 식물이 "빛 에너지"를 이용해 이산화 탄소와 물로 "포도당"을 만드는 과정이다. ＿＿＿은
              식물 세포의 "엽록체"에서 일어난다.
            </p>
          </div>
          <div className="quiz-mock__input">광합성</div>
          <div className="quiz-mock__fb">
            <b>정답! 외웠네요 👏</b>
            <span>2.1초 · 286타/분</span>
          </div>
          <div className="quiz-mock__rank">⌨️ 🌳 나무 · 172타</div>
        </div>
      </div>
    </section>
  );
}

import { asset } from '../data/site';
import { ArrowRight } from '../components/Icons';
import { ReviewOffBadge } from '../components/ReviewOffBadge';

export const BLANKBOOK_GUIDE = [
  {
    tag: '의도',
    title: '읽고 싶은 글이 따로 있을 때',
    body: '교재 지문 · 기사 · 노래 가사 · 회사 메일. 빈 책에 붙여 넣으면 그 글이 그대로 MolB 리더가 돼요.',
  },
  {
    tag: '쓰는 법',
    title: '붙여 넣고, 톡, 고쳐 적기',
    body: '새 책에 글을 붙여 넣거나 .txt를 열어요. 모르는 단어를 톡 누르면 내장 사전(약 5천 단어)의 뜻과 등급이 뜨고, 문맥에 맞게 내 말로 고쳐 적어요.',
  },
  {
    tag: '결과',
    title: '형광펜이 남은 책과 나만의 단어장',
    body: '책마다 담은 단어에 형광펜이 남고, 단어장에는 담은 문장째 쌓여요. 뜻 적기 퀴즈로 떠올려 보고, JSON · CSV로 내보낼 수 있어요.',
  },
];

export function BlankBookTeaser() {
  return (
    <section id="blankbook-intro" className="section bb-teaser" aria-labelledby="bb-teaser-title">
      <div className="container bb-teaser__grid">
        <div className="bb-teaser__copy" data-reveal>
          <p className="kicker">02 · 블랭크북</p>
          <h2 id="bb-teaser-title" className="section__title">
            내 글이 <em>MolB 리더</em>가 되는 빈 책
          </h2>
          <p className="section__lead">
            찍먹이 앱의 글을 읽어 보는 거라면, 블랭크북은 사이트에서 끝까지 쓰는 기능이에요. 책과 단어장은 이 브라우저에
            저장돼서 로그인이 필요 없어요.
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
            <ReviewOffBadge />
          </div>
        </div>

        <div className="book-mock" aria-hidden="true" data-reveal>
          <div className="book-mock__spine" />
          <div className="book-mock__page book-mock__page--left">
            <p className="book-mock__title">My Monday memo</p>
            <p className="book-mock__text">
              Please <mark>submit</mark> the report by Friday. If you have any <mark>questions</mark>, feel free to ask.
              The meeting room on the third floor is <span className="peek">available</span> after lunch.
            </p>
          </div>
          <div className="book-mock__page book-mock__page--right">
            <p className="book-mock__label">이 책의 단어 2</p>
            <div className="book-mock__word">
              <b>submit</b> <span className="chip">B2</span>
              <span>제출하다</span>
              <i>Please submit the report by Friday.</i>
            </div>
            <div className="book-mock__word">
              <b>question</b> <span className="chip">A1</span>
              <span>질문</span>
              <i>If you have any questions, feel free…</i>
            </div>
            <img className="book-mock__icon" src={asset('img/icons/notebook.webp')} alt="" width={64} height={64} />
          </div>
        </div>
      </div>
    </section>
  );
}

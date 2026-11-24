import { asset } from '../data/site';
import { goToSection } from '../hooks/useRoute';
import { Mascot } from '../components/Mascot';
import { ArrowRight, BookIcon } from '../components/Icons';

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__glow" aria-hidden="true" />
      <div className="container hero__grid">
        <div className="hero__copy" data-reveal>
          <p className="eyebrow">영어 읽기 · 교재 복습 · 몰비의 섬</p>
          <h1 id="hero-title" className="hero__title">
            서재에서 읽고,
            <br />
            <em>섬에서 써 봐요</em>
          </h1>
          <p className="hero__lead">
            몰비의 서재에서 읽던 책을 펼쳐 보세요. 모르는 낱말은 눌러서 단어장에 담고,
            섬에서는 마트에 들러 영어로 달걀을 주문해요.
          </p>
          <div className="hero__cta">
            <a
              className="btn btn--primary btn--lg"
              href="#/taste"
              onClick={(e) => {
                e.preventDefault();
                goToSection('taste');
              }}
            >
              지문 셋으로 찍먹하기 <ArrowRight size={18} />
            </a>
            <a className="btn btn--outline btn--lg" href="#/blankbook">
              <BookIcon size={18} /> 블랭크북 펼치기
            </a>
          </div>
          <ul className="hero__facts">
            <li>로그인 없이</li>
            <li>설치 없이</li>
            <li>기록은 이 브라우저에만</li>
          </ul>
        </div>

        <div className="hero__stage" data-reveal>
          <div className="phone phone--hero">
            <img
              src={asset('img/world/study-desk.webp')}
              alt="몰비의 서재 일러스트. 햇살이 드는 창가 책상 위에 책과 연필이 놓여 있다"
              width={540}
              height={1038}
              fetchPriority="high"
            />
          </div>
          <div className="float-card float-card--word" aria-hidden="true">
            <span className="float-card__label">#영어 · 톡 담았어요</span>
            <span className="float-card__word">
              <mark>acorns</mark> · 도토리
            </span>
          </div>
          <div className="float-card float-card--item" aria-hidden="true">
            <span className="float-card__label float-card__label--reading">#생명과학 · 빈칸 퀴즈</span>
            <span className="float-card__cloze">
              <span className="float-card__blank">?</span>은(는) 엽록체에서
              <br />
              일어나요
            </span>
          </div>
          <Mascot className="hero__mascot" size={128} says="오늘은 뭐 복습해? 헤헤" bubbleSide="top" />
        </div>
      </div>
    </section>
  );
}

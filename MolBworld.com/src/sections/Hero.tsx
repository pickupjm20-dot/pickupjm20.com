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
          <p className="eyebrow">영어 · 자격증 · 학교 공부 × 나만의 작은 세상</p>
          <h1 id="hero-title" className="hero__title">
            공부한 만큼,
            <br />
            몰비의 <em>세상이 넓어져요</em>
          </h1>
          <p className="hero__lead">
            영어 단어도, 자격증 용어도, 시험 범위의 개념도. 과목마다 단어장을 <b>태그</b>로 나눠 담으면, 복습할 때가 된 단어가 다람쥐
            몰비의 마을에 몽타주 · 신문 · 쪽지 시험으로 붙어요.
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
              src={asset('img/world/room-front.webp')}
              alt="MolB 앱의 월드 — 다람쥐 몰비가 사는 나무 방, 창밖으로 마당과 마을이 보인다"
              width={540}
              height={1200}
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

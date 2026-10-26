/** 몰비의 세상 — 사이트에서는 못 하는 앱의 월드를 에뮬레이터 사진(광고 13판의 원본)으로 구경한다. */
import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from '../components/Icons';
import { asset, CHARACTERS, characterImage } from '../data/site';
import { usePrefs } from '../hooks/prefs';

const GALLERY = [
  { src: 'box-place', title: '상자에서 꺼내 꾸미기', body: '온 물건은 상자에 모여요. 꺼내서 끌어 놓고, 돌리고, 도로 넣어요.' },
  { src: 'door-threshold', title: '문을 열면, 마당', body: '방이 차면 문밖으로. 텃밭 · 열매나무 · 우편함 · 라디오.' },
  { src: 'garden-dusk', title: '해가 지는 마당', body: '해와 달은 10분마다 움직이고, 실제 날씨의 비 · 눈이 내려요.' },
  { src: 'room-english', title: '영어로 말하는 몰비', body: '방의 물건을 누르면 몰비가 그 단어로 한마디 해요.' },
  { src: 'room-night', title: '밤의 방', body: '같은 방도 밤이면 불빛이 달라져요.' },
  { src: 'kupeng', title: '쿠펭 가게', body: '공부로 모은 도토리로 장을 봐요. 영어로 주문하면 문 앞까지 배달.' },
  { src: 'dex', title: '아이템 도감', body: '월드의 모든 물건과 선물 퀴즈. 읽은 글이 부른 물건이 자격이에요.' },
  { src: 'chat', title: '다람그램 · 몰비와의 대화방', body: '몰비가 새것 앞에서 찍은 사진 피드, 친구의 댓글, 몰비와의 대화.' },
  { src: 'reader-nine', title: '하루 아홉 칸', body: '리더의 첫 화면. 서버에 게시된 글 아홉 편과 미리 적은 풀이.' },
];

function BeforeAfter() {
  const [pos, setPos] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const drag = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
  };
  return (
    <div className="before-after phone">
      <div
        ref={box}
        className="before-after__box"
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          drag(e.clientX);
        }}
        onPointerMove={(e) => {
          if (e.buttons) drag(e.clientX);
        }}
      >
        <img src={asset('img/world/room-stage3.webp')} alt="단어를 익힌 뒤의 방 — 천장 등과 냉장고가 생겼다" width={540} height={1200} loading="lazy" />
        <div className="before-after__top" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <img src={asset('img/world/room-stage1.webp')} alt="처음의 방 — 등도 냉장고도 없다" width={540} height={1200} loading="lazy" />
        </div>
        <span className="before-after__tag before-after__tag--l">처음</span>
        <span className="before-after__tag before-after__tag--r">light · fridge를 익힌 뒤</span>
        <div className="before-after__handle" style={{ left: `${pos}%` }} aria-hidden="true">
          <span />
        </div>
      </div>
      <label className="sr-only" htmlFor="ba-range">
        처음의 방과 단어를 익힌 뒤의 방 견주기
      </label>
      <input
        id="ba-range"
        className="before-after__range"
        type="range"
        min={0}
        max={100}
        value={Math.round(pos)}
        onChange={(e) => setPos(Number(e.target.value))}
      />
    </div>
  );
}

export function World() {
  const { character, setCharacter } = usePrefs();
  const strip = useRef<HTMLDivElement>(null);
  const slide = (dir: 1 | -1) => strip.current?.scrollBy({ left: dir * 460, behavior: 'smooth' });
  return (
    <section id="world" className="section world" aria-labelledby="world-title">
      <div className="container">
        <div className="world__intro">
          <header className="section__head" data-reveal>
            <p className="kicker">03 · 몰비의 세상</p>
            <h2 id="world-title" className="section__title">
              단어 하나에 물건 하나, <em>방이 쌓여요</em>
            </h2>
            <p className="section__lead">
              월드는 게임 엔진이 아니라 손으로 짠 원근 위에 그린 한 세상이에요. 방 → 마루 → 마당 → 강 → 마을. 공부해서
              얻은 단어가 입체 물건이 되어 상자에 모이고, 꺼내서 내 마음대로 놓아요.
            </p>
            <ul className="world__points">
              <li>
                <b>light</b>를 익히면 천장 등이, <b>fridge</b>를 익히면 냉장고가 — 익힌 만큼만, 조금씩.
              </li>
              <li>탁상 전화기나 쿠펭 가게에 영어로 주문하면, 말한 특징대로 물건을 지어 배달해요.</li>
              <li>엘리베이터를 타면 이웃이 사는 마을 — 광장 · 가게 · 학교 · 경찰서, 들을 지나가는 기차. 이웃과 영어로 이야기하고, 전화도 와요.</li>
              <li>복습할 단어는 마을에 붙어요 — 경찰서의 몽타주, 책방의 신문, 마을회관의 전단지, 학교의 쪽지 시험.</li>
            </ul>
            <p className="world__try">← 손잡이를 끌어 처음의 방과 견줘 보세요</p>
          </header>
          <div data-reveal>
            <BeforeAfter />
          </div>
        </div>

        <div className="gallery__nav">
          <p>앱 화면 구경 — 옆으로 넘겨 보세요</p>
          <button type="button" className="icon-btn gallery__arrow" aria-label="이전 화면" onClick={() => slide(-1)}>
            <ArrowLeft size={18} />
          </button>
          <button type="button" className="icon-btn gallery__arrow" aria-label="다음 화면" onClick={() => slide(1)}>
            <ArrowRight size={18} />
          </button>
        </div>
        <div className="gallery" role="list" aria-label="앱 화면 구경" ref={strip}>
          {GALLERY.map((g) => (
            <figure key={g.src} className="gallery__item" role="listitem">
              <div className="phone phone--sm">
                <img src={asset(`img/world/${g.src}.webp`)} alt="" width={540} height={1200} loading="lazy" />
              </div>
              <figcaption>
                <b>{g.title}</b>
                <span>{g.body}</span>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="cast" data-reveal>
          <div className="cast__copy">
            <h3>몰비는 다섯 가운데 하나</h3>
            <p>
              앱처럼 여기서도 고를 수 있어요. 고른 캐릭터가 사이트의 머리줄 · 찍먹 · 블랭크북에 나와요. 이름은 누구든
              몰비예요.
            </p>
          </div>
          <ul className="cast__list">
            {CHARACTERS.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className={`cast__item${c.id === character ? ' is-on' : ''}`}
                  aria-pressed={c.id === character}
                  onClick={() => setCharacter(c.id)}
                >
                  <img src={characterImage(c.id)} alt="" width={120} height={120} loading="lazy" />
                  <b>{c.name}</b>
                  <span>{c.blurb}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

import { useRef, useState } from 'react';
import { asset, CHARACTERS, characterImage } from '../data/site';
import { usePrefs } from '../hooks/prefs';

const GALLERY = [
  { src: 'island-bakery', title: '바닷가 빵집', body: '빵집 너머로 해안 산책길이 이어져요.' },
  { src: 'island-mart', title: '동네 마트', body: '마트에서 달걀을 주문하고 집에 가져가 아침을 차려요.' },
  { src: 'island-greenhouse', title: '온실', body: '유리 지붕 아래로 초록 식물이 자라요.' },
];

function IslandLight() {
  const [pos, setPos] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const drag = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
  };
  return (
    <div className="before-after">
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
        <img src={asset('img/world/island-dusk.webp')} alt="노을이 내린 몰비의 해안 광장" width={960} height={400} loading="lazy" />
        <div className="before-after__top" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <img src={asset('img/world/island-afternoon.webp')} alt="오후 햇살이 비치는 같은 광장" width={960} height={400} loading="lazy" />
        </div>
        <span className="before-after__tag before-after__tag--l">오후</span>
        <span className="before-after__tag before-after__tag--r">노을</span>
        <div className="before-after__handle" style={{ left: `${pos}%` }} aria-hidden="true">
          <span />
        </div>
      </div>
      <label className="sr-only" htmlFor="ba-range">
        섬의 오후와 노을 비교
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
  return (
    <section id="world" className="section world" aria-labelledby="world-title">
      <div className="container">
        <div className="world__intro">
          <header className="section__head" data-reveal>
            <p className="kicker">03 · 몰비의 세상</p>
            <h2 id="world-title" className="section__title">
              몰비와 걷는 <em>작은 섬</em>
            </h2>
            <p className="section__lead">
              집에서 광장으로 걸어 나오면 바다가 보여요. 길에서 만난 이웃에게 말을 걸거나, 필요한 물건을 찾아 가게에 들러 보세요.
            </p>
            <ul className="world__points">
              <li>병원에서 반창고를 부탁하고, 경찰서에서 잃어버린 물건을 찾아요.</li>
              <li>집에는 모은 물건을 놓고, 책장을 열거나 라디오를 켤 수 있어요.</li>
              <li>섬에서 보낸 하루를 몰비의 영어 일기에 적어요.</li>
            </ul>
          </header>
          <div data-reveal>
            <IslandLight />
            <p className="world__try">손잡이를 움직여 광장의 오후와 노을을 비교해 보세요.</p>
          </div>
        </div>

        <div className="gallery" role="list" aria-label="섬의 장소 미리보기">
          {GALLERY.map((g) => (
            <figure key={g.src} className="gallery__item" role="listitem">
              <img src={asset(`img/world/${g.src}.webp`)} alt={g.title} width={600} height={400} loading="lazy" />
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

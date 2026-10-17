import { asset } from '../data/site';

const STEPS = [
  {
    icon: 'book_open',
    title: '읽기',
    tag: '리더',
    body: '하루 아홉 칸의 짧은 읽을거리. 그림과 함께 한 편씩, 목표가 토익이면 가운데 칸이 오늘의 토익.',
  },
  {
    icon: 'new_words',
    title: '톡 담기',
    tag: '리더',
    body: '모르는 단어만 톡. 미리 적어 둔 풀이와 문장 해석이 그 자리에 뜨고, 단어장에 담기며 형광펜이 남아요.',
  },
  {
    icon: 'review_quiz',
    title: '떠올리기',
    tag: '단어장',
    body: '단어장은 FSRS-6로 낱말마다 복습할 날을 정해요. 낱말을 보고 뜻을 적고, 기억할수록 형광펜이 옅어져요.',
  },
  {
    icon: 'tree_medium',
    title: '넓어지기',
    tag: '월드',
    body: '익힌 단어가 몰비의 방에 물건으로 와요. 방이 차면 마당으로, 버스를 타면 도토리 마을까지.',
  },
];

export function Flow() {
  return (
    <section id="about" className="section flow" aria-labelledby="flow-title">
      <div className="container">
        <header className="section__head" data-reveal>
          <p className="kicker">MolB는 이렇게 흘러가요</p>
          <h2 id="flow-title" className="section__title">
            외우는 앱이 아니라, <em>읽는 앱</em>이에요
          </h2>
          <p className="section__lead">
            단어 목록부터 펼치지 않아요. 글을 읽다 막힌 단어만 모으고, 모은 만큼 몰비의 세상이 자라요. 하단바의 네 칸 —
            리더 · 월드 · 단어장 · 설정 — 이 그 길을 나눠 맡아요.
          </p>
        </header>
        <ol className="flow__steps">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flow__step" data-reveal style={{ transitionDelay: `${i * 70}ms` }}>
              <span className="flow__num">{String(i + 1).padStart(2, '0')}</span>
              <img src={asset(`img/icons/${s.icon}.webp`)} alt="" width={72} height={72} loading="lazy" />
              <h3>
                {s.title} <span className="chip">{s.tag}</span>
              </h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

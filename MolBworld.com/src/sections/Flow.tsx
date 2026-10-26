import { asset } from '../data/site';

/** MolB의 방향(앱 FOLLOW_UP 135): "복습해야 할 단어가 자연스레 나오는 세계" — 영어는 추가 기능, 단어장은 태그로 갈린다. */
const STEPS = [
  {
    icon: 'book_open',
    title: '담기',
    tag: '리더 · 단어장',
    body: '영어 글은 읽다가 모르는 단어만 톡. 자격증 · 과목 용어는 ‘낱말 — 뜻’ 목록을 붙여 넣거나, PDF 교재를 책으로 열어 담아요.',
  },
  {
    icon: 'notebook',
    title: '태그로 나누기',
    tag: '단어장',
    body: '#영어 #정보처리기사 #한국사 — 과목마다 단어장을 태그로 갈라요. 영어도 여러 태그 가운데 하나예요.',
  },
  {
    icon: 'review_quiz',
    title: '떠올리기',
    tag: '빈칸 퀴즈',
    body: '뜻이나 문맥을 보고 용어를 쳐서 떠올려요. FSRS-6가 낱말마다 복습할 날을 정해, 잊을 때가 된 것부터 나와요.',
  },
  {
    icon: 'tree_medium',
    title: '세상에서 다시 만나기',
    tag: '월드',
    body: '복습할 단어가 마을에 몽타주 · 신문 · 전단지 · 쪽지 시험으로 붙어요. 익힌 만큼 몰비의 방도 자라요.',
  },
];

export function Flow() {
  return (
    <section id="about" className="section flow" aria-labelledby="flow-title">
      <div className="container">
        <header className="section__head" data-reveal>
          <p className="kicker">MolB는 이렇게 흘러가요</p>
          <h2 id="flow-title" className="section__title">
            복습할 단어가, <em>세상에 자연스레</em> 나와요
          </h2>
          <p className="section__lead">
            단어 목록을 붙들고 외우지 않아요. 공부하다 막힌 말만 모아 두면, 다시 볼 때가 된 단어를 몰비의 세상이 알아서 꺼내 와요. 영어 공부도,
            자격증 · 학교 공부도 같은 길이에요.
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

import { asset, LINKS } from '../data/site';
import { Mascot } from '../components/Mascot';
import { PlayStoreIcon } from '../components/Icons';

const FAQ = [
  {
    q: '사이트에서 담은 단어는 어디에 저장돼요?',
    a: '이 브라우저의 localStorage에만 저장돼요. 서버로 보내지 않아서 로그인이 필요 없지만, 사이트 데이터를 지우거나 다른 기기 · 다른 브라우저로 가면 보이지 않아요. 블랭크북의 ‘내보내기’로 JSON 파일을 받아 두면 다시 ‘가져오기’로 살릴 수 있어요.',
  },
  {
    q: '사이트에서도 복습 알림이 오나요?',
    a: '아니요. 사이트판에는 복습 알고리즘이 적용되어 있지 않아요(화면 곳곳의 ‘복습 알고리즘 꺼짐’ 표시). 뜻 적기 퀴즈는 무작위 순서이고 맞힌 횟수만 남겨요. 앱의 단어장은 FSRS-6로 낱말마다 다음 복습일을 정해요.',
  },
  {
    q: '사이트의 단어장을 앱으로 옮길 수 있어요?',
    a: '아직은 안 돼요. 지금은 JSON · CSV로 내보내기까지예요. 앱은 계정에 단어장을 동기화해요.',
  },
  {
    q: '블랭크북의 뜻은 어디서 와요? AI인가요?',
    a: '앱에 실린 내장 사전(약 5천 단어, CEFR 등급 포함)에서 와요. 사이트는 AI를 부르지 않아요. 사전에 없는 단어나 문맥에서 뜻이 다른 단어는 직접 고쳐 적으면 돼요 — 그래서 ‘블랭크’북이에요.',
  },
  {
    q: '찍먹 지문의 풀이는 누가 적었어요?',
    a: '앱의 번들 읽을거리와 같은 글 파일이에요. 문장마다 해석과 낱말 풀이(사전형 · 숙어 포함)가 미리 적혀 있어서, 앱의 리더도 이 글에서는 AI 없이 같은 풀이를 보여 줘요.',
  },
  {
    q: '앱은 어디서 받아요?',
    a: 'Android는 Google Play에서 받을 수 있어요. 로그인은 구글 · 네이버 · 카카오 · 이메일, 로그인하지 않으면 단어장 50개까지 써 볼 수 있어요.',
  },
];

export function Faq() {
  return (
    <section id="faq" className="section faq" aria-labelledby="faq-title">
      <div className="container faq__grid">
        <header className="section__head" data-reveal>
          <p className="kicker">자주 묻는 것</p>
          <h2 id="faq-title" className="section__title">
            궁금한 게 있다면
          </h2>
          <img className="faq__icon" src={asset('img/icons/diary.webp')} alt="" width={120} height={120} loading="lazy" />
        </header>
        <div className="faq__list" data-reveal>
          {FAQ.map((f) => (
            <details key={f.q} className="faq__item">
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="final-cta" aria-labelledby="final-title">
      <div className="container final-cta__row" data-reveal>
        <Mascot pose="dance" size={140} />
        <div>
          <h2 id="final-title">오늘 한 편부터, 몰비와 같이.</h2>
          <p>찍먹으로 손에 익었다면, 매일의 읽을거리와 알아서 돌아오는 복습은 앱에서.</p>
        </div>
        <div className="final-cta__btns">
          <a className="btn btn--primary btn--lg" href={LINKS.play} target="_blank" rel="noopener noreferrer">
            <PlayStoreIcon size={18} /> Google Play에서 받기
          </a>
          <a className="btn btn--outline btn--lg" href="#/blankbook">
            블랭크북 계속하기
          </a>
        </div>
      </div>
    </section>
  );
}

import { asset, LINKS } from '../data/site';
import { Mascot } from '../components/Mascot';
import { PlayStoreIcon } from '../components/Icons';

const FAQ = [
  {
    q: '영어 말고 자격증 · 학교 공부도 돼요?',
    a: '네. 앱의 단어장은 태그로 갈려서 #정보처리기사 · #한국사 · #생명과학처럼 과목마다 나눠 담고, 우리말 용어는 뜻 · 정의를 적어 담아요. 빈칸 퀴즈가 뜻 · 문맥을 보고 용어를 떠올리게 하고, 복습할 단어는 마을에 몽타주 · 신문 · 쪽지 시험으로 붙어요. 이 사이트에서는 블랭크북으로 바로 해 볼 수 있어요.',
  },
  {
    q: '블랭크북은 어떻게 써요?',
    a: '학습주제(책)를 만들고 주제 카드에 제목과 내용을 적어요. 외울 말을 "큰따옴표"로 감싸거나 칠하기로 누르면, 맞춰 보기에서 그 말이 빈칸이 돼요. 조사(은 · 는 · 을 · 를 …)는 빈칸 밖에 남고, 틀리게 나뉘었으면 칠하기에서 꾹 눌러 고쳐요.',
  },
  {
    q: '블랭크북 자료를 AI가 만들어 주나요?',
    a: '사이트는 AI를 부르지 않아요. ‘부탁 글 복사’로 꼴을 일러 주는 글을 복사해 ChatGPT · Claude · Gemini 같은 AI 채팅에 붙여 넣고 끝에 주제를 적으면, 따옴표 빈칸 꼴의 자료가 나와요. 그 답을 ‘AI 자료 붙여 넣기’에 넣으면 책이 서요.',
  },
  {
    q: '사이트에서 한 공부는 어디에 저장돼요?',
    a: '이 브라우저의 localStorage에만 저장돼요. 서버로 보내지 않아서 로그인이 필요 없지만, 사이트 데이터를 지우거나 다른 기기 · 다른 브라우저로 가면 보이지 않아요. 블랭크북의 ‘내보내기’로 JSON 파일을 받아 두면 ‘가져오기’로 다시 살릴 수 있어요.',
  },
  {
    q: '사이트에서도 복습 알림이 오나요?',
    a: '아니요. 사이트판에는 복습 알고리즘이 적용되어 있지 않아요(화면 곳곳의 ‘복습 알고리즘 꺼짐’ 표시). 블랭크북은 안 푼 것 · 지난번에 틀린 것을 먼저 낼 뿐 다음 복습일은 정하지 않아요. 앱의 단어장은 FSRS-6로 낱말마다 다음 복습일을 정해요.',
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
          <p>영어도, 자격증도, 학교 공부도 — 매일의 읽을거리와 알아서 돌아오는 복습은 앱에서.</p>
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

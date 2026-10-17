import { ReviewOffBadge } from '../components/ReviewOffBadge';

const ROWS: { what: string; site: React.ReactNode; app: string }[] = [
  { what: '읽을거리', site: '앱의 지문 셋 + 내가 붙여 넣은 글', app: '하루 아홉 칸 · 오늘의 토익 · 내 파일' },
  { what: '낱말 풀이', site: '미리 적은 풀이(지문) · 내장 사전 약 5천 단어(블랭크북)', app: '미리 적은 풀이 + AI(서버를 거쳐서)' },
  { what: '내 글 열기', site: '붙여 넣기 · .txt', app: '.txt · .pdf · .docx · 사진 OCR' },
  { what: '단어장', site: '이 브라우저에 저장 · JSON/CSV 내보내기', app: '계정에 동기화 · 다의어는 뜻마다 카드' },
  {
    what: '복습',
    site: (
      <>
        무작위 뜻 적기, 맞힌 횟수만 <ReviewOffBadge />
      </>
    ),
    app: 'FSRS-6가 낱말마다 복습일을 정하고, 형광펜이 옅어져요',
  },
  { what: '학습 로그', site: '찍먹의 ‘공부 끝!’', app: '‘공부 끝!’ + 주간 기록 + 문맥 퀴즈' },
  { what: '몰비의 세상', site: '사진으로 구경 · 캐릭터 고르기', app: '방 · 마당 · 마을 · 다람그램 · 도감 · 일기장' },
];

export function Compare() {
  return (
    <section className="section compare" aria-labelledby="compare-title">
      <div className="container">
        <header className="section__head section__head--center" data-reveal>
          <p className="kicker">사이트와 앱</p>
          <h2 id="compare-title" className="section__title">
            사이트에서는 <em>맛보기</em>, 앱에서는 <em>매일</em>
          </h2>
          <p className="section__lead">
            사이트는 MolB가 어떤 앱인지 직접 해 보고 시작하는 곳이에요. 매일 쌓이고 알아서 복습되는 건 앱의 몫이에요.
          </p>
        </header>
        <div className="compare__table" role="table" aria-label="사이트와 앱에서 되는 것" data-reveal>
          <div className="compare__row compare__row--head" role="row">
            <span role="columnheader" />
            <span role="columnheader">MolB World (여기)</span>
            <span role="columnheader">MolB 앱</span>
          </div>
          {ROWS.map((r) => (
            <div key={r.what} className="compare__row" role="row">
              <span role="rowheader">{r.what}</span>
              <span role="cell">{r.site}</span>
              <span role="cell">{r.app}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

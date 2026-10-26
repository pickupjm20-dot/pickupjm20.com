import { ReviewOffBadge } from '../components/ReviewOffBadge';

const ROWS: { what: string; site: React.ReactNode; app: string }[] = [
  { what: '공부할 것', site: '앱의 영어 지문 셋(찍먹) · 내가 필기한 개념(블랭크북)', app: '영어 읽을거리 · 단어장 태그(자격증 · 과목) · PDF 교재' },
  { what: '담는 법', site: '톡 · 꾹(찍먹), 따옴표 · 칠하기 · AI 자료 붙여 넣기(블랭크북)', app: '톡 · 꾹, ‘낱말 — 뜻’ 붙여 넣기, PDF 책에서 담기' },
  { what: '자료 열기', site: '직접 적기 · 붙여 넣기 · .txt · .md', app: '.txt · .pdf · .docx · 사진 OCR' },
  { what: '퀴즈', site: '빈칸 타자(블랭크북) · 뜻 적기(찍먹)', app: '빈칸 퀴즈 · 스피드 퀴즈 · 마을의 쪽지 시험' },
  {
    what: '복습',
    site: (
      <>
        안 푼 것 · 틀린 것 먼저, 일정은 없음 <ReviewOffBadge />
      </>
    ),
    app: 'FSRS-6가 낱말마다 복습일을 정하고, 복습할 단어가 마을에 몽타주 · 신문 · 전단지로 붙어요',
  },
  { what: '기록', site: '이 브라우저에 저장 · JSON 내보내기 · 내 타자 등급', app: '계정에 동기화 · 태그별 단어장 · 학습 로그' },
  { what: '몰비의 세상', site: '사진으로 구경 · 캐릭터 고르기', app: '방 · 마당 · 마을(이웃 · 전화 · 기차) · 다람그램 · 도감' },
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
            사이트는 MolB가 어떤 앱인지 직접 해 보고, 블랭크북으로 빈칸 공부를 하는 곳이에요. 매일 쌓이고 알아서 복습되는 건 앱의 몫이에요.
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

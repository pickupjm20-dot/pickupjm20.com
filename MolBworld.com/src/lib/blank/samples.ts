/**
 * 예시 학습주제 — 블랭크북을 처음 여는 사람이 자료 없이도 맞춰 보기까지 해 보게. 학교 공부 · 자격증 · 영어를 하나씩 둔다(MolB의
 * 방향: 영어는 여러 공부 가운데 하나). 모두 따옴표 자료 꼴이라 사람이 AI로 만든 자료를 붙여 넣는 것과 같은 길로 책이 선다.
 * 이 사이트를 위해 쓴 글이다 — 내용은 교과서 수준의 사실만 적었다.
 */
import type { BlankBook } from './book';
import { bookFromMaterial, parseQuotedMaterial } from './material';

export type Sample = { id: string; kind: string; label: string; material: string };

export const SAMPLES: Sample[] = [
  {
    id: 'bio',
    kind: '학교 공부',
    label: '생명과학 · 광합성과 세포 호흡',
    material: `제목: 광합성
"광합성"은 식물이 "빛 에너지"를 이용해 이산화 탄소와 물로 "포도당"을 만드는 과정이다. 광합성은 식물 세포의 "엽록체"에서 일어나며, 이때 "산소"가 함께 만들어진다.

제목: 세포 호흡
"세포 호흡"은 포도당을 분해해 생명 활동에 필요한 에너지를 얻는 과정이다. 세포 호흡은 주로 "미토콘드리아"에서 일어나며, 얻은 에너지는 "ATP" 형태로 저장된다.`,
  },
  {
    id: 'db',
    kind: '자격증',
    label: '정보처리기사 · 데이터베이스',
    material: `제목: 정규화
"정규화"는 테이블을 나누어 데이터의 중복을 줄이고 "이상 현상"을 막는 과정이다. 이상 현상에는 "삽입 이상", "삭제 이상", "갱신 이상"이 있다.

제목: 트랜잭션
"트랜잭션"은 데이터베이스에서 한꺼번에 수행되어야 하는 작업의 단위이다. 트랜잭션은 "원자성", "일관성", "독립성", "지속성"을 지켜야 하며, 이 네 성질을 머리글자를 따서 "ACID"라고 부른다.`,
  },
  {
    id: 'history',
    kind: '자격증',
    label: '한국사 · 조선 전기',
    material: `제목: 훈민정음
"세종"은 1443년 "훈민정음"을 창제하고 1446년에 반포하였다. 훈민정음은 백성을 가르치는 바른 소리라는 뜻이다.

제목: 경국대전
"경국대전"은 조선의 기본 법전이다. "세조" 때 편찬을 시작하여 "성종" 때 완성하고 반포하였다.`,
  },
  {
    id: 'toeic',
    kind: '영어',
    label: '토익 · 사무실 영어',
    material: `제목: Schedules
The meeting was "postponed" until next Monday because the manager was out of town. Please "submit" your expense report by Friday.

제목: Office notices
The cafeteria will be "temporarily" closed for "renovation". Employees are "required" to wear their ID badges at all times.`,
  },
];

export function sampleBook(sample: Sample): BlankBook {
  const m = parseQuotedMaterial(sample.material)!;
  return { ...bookFromMaterial(m, sample.label), title: sample.label, sample: sample.id };
}

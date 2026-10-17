/** 사이트 곳곳이 같이 쓰는 값 — 링크 · 캐릭터 · 앱의 기능 목록. */

export const LINKS = {
  /** 앱의 서버 설정(`config/app.storeUrl`)과 같은 주소. */
  play: 'https://play.google.com/store/apps/details?id=my.own.language.book',
  privacy: 'https://pickupjm20-dot.github.io/molb-privacy/',
};

export const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export type CharacterId = 'squirrel' | 'frog' | 'hedgehog' | 'owl' | 'penguin';
export type Pose = 'smiling' | 'reading' | 'observing' | 'dance' | 'writing';

export const CHARACTERS: { id: CharacterId; name: string; blurb: string }[] = [
  { id: 'squirrel', name: '다람쥐', blurb: '호기심 많은 원조 몰비' },
  { id: 'frog', name: '개구리', blurb: '느긋하게 한 편씩' },
  { id: 'hedgehog', name: '고슴도치', blurb: '꼼꼼하게 다시 보기' },
  { id: 'owl', name: '부엉이', blurb: '밤에 읽는 걸 좋아해요' },
  { id: 'penguin', name: '펭귄', blurb: '주문은 로켓처럼' },
];

export const characterImage = (id: CharacterId, pose: Pose = 'smiling') => asset(`img/characters/${id}-${pose}.webp`);

export const characterName = (id: CharacterId) => CHARACTERS.find((c) => c.id === id)?.name ?? '다람쥐';

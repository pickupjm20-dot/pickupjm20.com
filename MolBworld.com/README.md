# MolB World

영어 학습 앱 **MolB**의 대표 홈페이지. MolB가 어떤 앱인지 읽고, **직접 해 보고** 시작하는 곳이다.

- **찍먹** — 앱에 실린 지문 셋(쉬움 · 보통 · 조금 어려움)으로 앱의 리더를 그대로 해 본다. 톡(담기) · 꾹(보기만) · 해석 ·
  ‘공부 끝!’ 학습 로그 · 뜻 적기 퀴즈. 풀이는 앱의 글 파일에 미리 적힌 그대로라 AI 없이 앱과 같은 답이 뜬다.
- **블랭크북** — 내 글을 붙여 넣으면(.txt도) MolB 리더가 되는 빈 책. 내장 사전(약 5천 단어 · CEFR 등급)으로 뜻을 띄우고,
  문맥에 맞게 고쳐 적고, 단어장 · 퀴즈 · JSON/CSV 내보내기까지 사이트에서 끝난다. 장부는 이 브라우저의 localStorage에만 산다.
- **몰비의 세상** — 앱의 월드를 에뮬레이터 사진으로 구경(처음의 방 ↔ 단어를 익힌 뒤의 방 견주기), 캐릭터 다섯 가운데 고르기.
- 찍먹과 블랭크북의 퀴즈 · 단어장 자리마다 **‘복습 알고리즘 꺼짐’** 표시가 작게 붙는다 — 앱은 FSRS-6로 낱말마다 다음
  복습일을 정하지만, 사이트는 담기 · 뜻 적기 · 맞힌 횟수까지만 하고 일정은 잡지 않는다.

## 실행

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # vitest — 지문 파서 · 사전형 후보 · 장부 · 채점
npm run build      # tsc --noEmit + vite build → dist/
npm run preview    # dist/를 띄워 본다
```

Node 22에서 확인했다.

## 기술과 그 까닭

| 고른 것 | 왜 |
| --- | --- |
| **React 19 + Vite 8 + TypeScript** | 홈페이지는 상태가 있는 조각(리더 · 카드 · 퀴즈 · 책장)이 많고, 빌드는 정적 파일 몇 개면 된다. |
| React Native는 쓰지 않았다 | 앱은 Flutter라 RN과 나눌 코드가 없고, 웹 홈페이지에는 React DOM이 맞다. 대신 규칙은 `src/lib/`에 화면 없이 모아 두어(순수 함수) 나중에 RN · 다른 웹에서도 그대로 가져다 쓸 수 있다. |
| 해시 라우팅(`#/blankbook`) | `pickupjm20.com/MolBworld.com/` 같은 하위 경로 · GitHub Pages에서도 새로고침 · 링크 공유가 404 없이 돈다. |
| `base: './'` | 같은 빌드를 어느 경로에 올려도 된다(나중에 molbworld.com 뿌리로 옮겨도). |
| 서버 · AI 없음 | 키를 사이트에 둘 수 없다. 찍먹은 미리 적은 풀이, 블랭크북은 내장 사전 + 사용자가 적는 뜻. |
| localStorage | 로그인 없이 바로 쓰게. 읽기 · 쓰기는 전부 try/catch — 사생활 창 · 꽉 찬 저장소에서도 화면은 돌고, 책장이 띠로 알린다. |

## 지도

```
index.html              첫 그림 전에 낮/밤 테마를 정하는 스크립트, 공유 미리보기(og)
src/
  App.tsx               해시 라우터 · 머리줄 · 바닥줄
  pages/HomePage.tsx    히어로 → 흐름 → 찍먹 → 블랭크북 소개 → 몰비의 세상 → 사이트와 앱 → 자주 묻는 것
  pages/BlankBookPage.tsx + pages/blankbook/   책장 · 새 책 · 책 읽기(사전 카드 · 등급 막대) · 단어장
  sections/             홈의 절들. Taste.tsx가 찍먹(리더 · 풀이 카드 · 담은 단어 · 학습 로그)
  components/           Reader(톡 · 꾹 · 키보드) · QuizRunner · ReviewOffBadge · Mascot · Header · Icons
  lib/                  화면을 모르는 규칙
    text.ts             문단 → 문장 → 낱말(앱의 sentence_splitter · keyOf와 같은 규칙)
    gloss.ts            앱의 읽을거리 글 파일(`=== 문장 해석 ===`) 읽기 · 풀이 찾기 · 숙어
    lemma.ts            사전형 후보(앱의 LemmatizationService 불규칙 표 428쌍)
    dictionary.ts       내장 사전(처음 열 때 한 번 받는다)
    library.ts          블랭크북 장부(책 · 낱말) — 순수 함수
    quiz.ts             뜻 적기 채점 · 섞기
    storage.ts          localStorage 손잡이
  content/passages/     찍먹 지문(앱의 refresh_0 · 2 · 14 그대로)
  styles/               tokens.css(앱 theme.dart의 색 · 글꼴 · 본문 자) · base · home · reader · blankbook
public/
  img/                  캐릭터 다섯 × 몸짓 다섯 · 앱 아이콘 · 지문 그림 · 월드 사진(광고 13판의 에뮬레이터 원본)
  dict/en_ko.json       [낱말, 뜻, 품사, 발음, 등급] 배열
  fonts/                Literata(OFL) — 앱의 본문 글꼴
scripts/import_assets.py   MolB 저장소에서 위의 것을 옮기고 웹에 맞게 줄인다
```

## 앱과의 관계 — 정본은 MolB

그림 · 글꼴 · 지문 · 사전은 MolB 저장소의 것이다. 여기서 손으로 고치지 말고 MolB에서 고친 뒤 다시 옮긴다.

```bash
python3 scripts/import_assets.py ../../MolB   # MolB 체크아웃 경로
```

찍먹 지문을 바꾸려면 스크립트의 `PASSAGES`와 `src/data/passages.ts`를 같이 고친다. 색은 앱의 `lib/theme.dart`
(TossColors)와 같은 값을 `src/styles/tokens.css`에 둔다 — 앱의 색이 바뀌면 여기도 바꾼다.

## 디자인 메모

- 앱과 같은 의미색 — 오렌지는 행동(버튼), 초록은 성장(담은 단어 · 진행), 보라는 읽기(해석 · 숙어), 코랄은 틀림.
- 본문은 앱처럼 Literata(17px · 행간 1.62 · 한 줄 34em · 문단 첫 줄 1.5em 들여쓰기), UI는 Pretendard(CDN).
- 밤 테마는 차가운 검정이 아니라 불 꺼진 나무 방의 갈색. 기기 설정을 따르고, 머리줄의 달 단추로 바꾼다.
- 고른 캐릭터가 머리줄 · 히어로 · 찍먹 반응 · 블랭크북에 선다. 몰비의 말은 앱의 `docs/MOLB_CHARACTER.md` 말투(반말 · 호기심).
- 움직임 줄이기를 켠 사람에게는 떠오르기 · 흔들림을 끈다. 리더는 키보드로도 쓴다(← → 옮기기, Enter 담기, Shift+Enter 보기만).

## 남은 것

- 도메인 — 지금은 이 저장소(`pickupjm20.com`)의 `MolBworld.com/` 폴더다. 올릴 곳(GitHub Pages · pickupjm20.com 하위 경로 ·
  molbworld.com)을 정하면 `dist/`를 그대로 올린다. 배포 워크플로는 아직 없다(CI는 빌드 · 검사만).
- 공유 미리보기 — `index.html`의 `og:image`는 상대 경로(`./img/og.jpg`)다. 몇몇 메신저는 절대 주소만 읽으니, 도메인이
  정해지면 `https://…/img/og.jpg`로 바꾼다.
- Windows판 받기 링크 — 공개 주소가 없어 ‘앱 받기’는 Google Play 하나만 건다(`src/data/site.ts`의 `LINKS`).
- 사이트 단어장 → 앱 계정으로 옮기기는 없다(JSON · CSV 내보내기까지).
- Pretendard는 CDN에서 받는다. CDN이 막히면 시스템 한글 글꼴로 떨어진다 — 직접 싣고 싶으면 `public/fonts/`로.

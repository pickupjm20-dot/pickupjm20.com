# MolB World

학습 앱 **MolB**의 대표 홈페이지. MolB가 어떤 앱인지 읽고, **직접 해 보고** 시작하는 곳이다.

> **기준은 앱의 `MolB-1.4.0` 가지(2026-10-26).** 1.4.0부터 MolB의 방향은 *"복습해야 할 단어가 자연스레 나오는 세계"* 다 —
> 영어는 여러 공부 가운데 하나(추가 기능)가 되고, 단어장은 태그로 갈려 자격증 · 학교 과목의 우리말 용어도 같이 복습한다(앱 `docs/FOLLOW_UP.md` 135 · 136 · 138).

- **무엇을 공부하나** — 영어 · 자격증 · 학교 공부. 태그로 나누는 단어장 · ‘낱말 — 뜻’ 붙여 넣기 · 빈칸 퀴즈 · PDF 교재 공부를
  소개하고, 과목을 고르면 그 과목의 낱말로 마을의 인쇄물(🔍 몽타주 · 🗞️ 신문 · 📝 쪽지 시험)이 붙는다. 몽타주는 실제로 풀 수 있다.
  1.4.0의 마을 화면 사진이 아직 없어 인쇄물은 앱의 틀(`world_print_sheet.dart`)을 따라 CSS로 그렸다.
- **찍먹** — 앱에 실린 영어 지문 셋(쉬움 · 보통 · 조금 어려움)으로 앱의 리더를 그대로 해 본다. 톡(담기) · 꾹(보기만) · 해석 ·
  ‘공부 끝!’ 학습 로그 · 뜻 적기 퀴즈. 풀이는 앱의 글 파일에 미리 적힌 그대로라 AI 없이 앱과 같은 답이 뜬다. 다 읽으면
  ‘이 글로 블랭크북 만들기’ — 지문이 주제 카드가 되고 담은 단어가 빈칸이 된다.
- **블랭크북** — 외울 말을 지운 빈칸을 쳐서 채우는 공부. 앱에 있다가(리더 탭의 셋째 화면, 10-16 ~ 10-19, 걷은 커밋 `dfc4171`)
  사이트로 옮겨 왔다. 원본은 웹 ‘과연 내가 외웠을까?’. 아래 절.
- **몰비의 세상** — 앱의 월드를 에뮬레이터 사진으로 구경(처음의 방 ↔ 단어를 익힌 뒤의 방 견주기), 캐릭터 다섯 가운데 고르기.
- 퀴즈 · 단어장 자리마다 **‘복습 알고리즘 꺼짐’** 표시가 작게 붙는다 — 앱은 FSRS-6로 낱말마다 다음 복습일을 정하지만,
  사이트는 맞힌 · 틀린 횟수까지만 적고 일정은 잡지 않는다.

## 블랭크북

앱의 설계서(`docs/BLANKBOOK_DESIGN.md`, `dfc4171^`)와 코드(`lib/services/blankbook/` · `lib/utils/josa.dart`)를 옮겼다.

| 것 | 사이트에서 |
| --- | --- |
| 책 · 주제 카드 | 학습주제(책) 하나에 주제 카드(제목 · 내용) 여럿. 카드 접기 · 옮기기 · 지우기, 책 이름 바꾸기 · 지우기 |
| 외울 낱말 | 내용 칸의 **"큰따옴표"**, 또는 **칠하기**(어절을 눌러 켜고 끔). 한 낱말을 칠하면 그 낱말이 선 자리가 다 칠해진다 |
| 조사 | 빈칸은 낱말 자리만 덮고 조사는 남긴다('광합성은' → ? + 은(는)). 기기의 짐작(받침 짝 · 긴 조사부터 · 짧은 끝 · 같은 글의 앎)에, 틀리면 칠하기에서 **꾹** 눌러 고친다 |
| 자료 | 빈 학습주제 · .txt · .md · **AI 자료 붙여 넣기**(제목: … / "따옴표" 꼴) · **부탁 글 복사**(ChatGPT · Claude · Gemini에 줄 글). 그냥 글은 규칙으로 먼저 칠한다(✨ 자동으로 고르기) |
| 맞춰 보기 | 카드 하나에 한 문제 · 빈칸 타자 · 모르겠어요 · 정답 · 내 답의 글자 차이 · n초 · n타/분 · 띄어쓰기 무시 · 틀린 것만 다시 |
| 내 타자 | 두벌식 타수 · 맞힌 답만 · 등급 사다리(🌰 도토리 ~ 👑 날다람쥐) · 최고 기록 · 14일 막대 |
| 예시 | 생명과학(학교 공부) · 정보처리기사 · 한국사(자격증) · 토익(영어) |

**뺀 것** — OCR(PDF · 사진), AI(조사 확인 · AI로 고르기), FSRS 복습 일정. 문제 차례는 안 푼 것 · 지난번에 틀린 것이 먼저일 뿐이다.
장부는 이 브라우저의 localStorage(`molbworld.blankbook.v1`) 한 칸 — 앱도 블랭크북은 서버로 안 올렸다. 옮길 길은 JSON 내보내기 · 가져오기.

## 실행

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # vitest — 지문 파서 · 조사 · 따옴표 자료 · 맞춰 보기 · 타자 · 장부
npm run build      # tsc --noEmit + vite build → dist/
npm run preview    # dist/를 띄워 본다
```

Node 22에서 확인했다.

## 기술과 그 까닭

| 고른 것 | 왜 |
| --- | --- |
| **React 19 + Vite 8 + TypeScript** | 홈페이지는 상태가 있는 조각(리더 · 카드 · 퀴즈 · 책장)이 많고, 빌드는 정적 파일 몇 개면 된다. |
| React Native는 쓰지 않았다 | 앱은 Flutter라 RN과 나눌 코드가 없고, 웹 홈페이지에는 React DOM이 맞다. 대신 규칙은 `src/lib/`에 화면 없이 모아 두어(순수 함수) 나중에 RN · 다른 웹에서도 그대로 가져다 쓸 수 있다. |
| 해시 라우팅(`#/blankbook/<책>/quiz`) | `pickupjm20.com/MolBworld.com/` 같은 하위 경로 · GitHub Pages에서도 새로고침 · 링크 공유가 404 없이 돈다. |
| `base: './'` | 같은 빌드를 어느 경로에 올려도 된다(나중에 molbworld.com 뿌리로 옮겨도). |
| 서버 · AI 없음 | 키를 사이트에 둘 수 없다. 찍먹은 미리 적은 풀이, 블랭크북은 사람이 적은 필기 + 기기의 조사 짐작. |
| localStorage | 로그인 없이 바로 쓰게. 읽기 · 쓰기는 전부 try/catch — 사생활 창 · 꽉 찬 저장소에서도 화면은 돌고, 책장이 띠로 알린다. |
| 매니페스트 + 손으로 쓴 오프라인 일꾼 | 폰 홈 화면에 두면 앱처럼(주소창 없이) 열리고, 한 번 연 뒤로는 인터넷 없이도 돈다. 서버가 없는 사이트라 빌드의 파일(약 1.7MB)을 다 미리 받으면 끝이어서, 플러그인 대신 `vite.config.ts`의 `offline()` 수십 줄이 빌드 끝에 `dist/sw.js`를 짓는다. |

## 지도

```
index.html              첫 그림 전에 낮/밤 테마를 정하는 스크립트, 공유 미리보기(og), 매니페스트
vite.config.ts          offline() — 빌드 끝에 dist/sw.js(오프라인 일꾼)를 짓는다
src/
  App.tsx               해시 라우터 · 머리줄 · 바닥줄
  pages/HomePage.tsx    히어로 → 흐름 → 무엇을 공부하나 → 찍먹 → 블랭크북 소개 → 몰비의 세상 → 사이트와 앱 → 자주 묻는 것
  pages/BlankBookPage.tsx + pages/blankbook/   북 페이지(Shelf) · 개념 필기(Notes — 따옴표 · 칠하기 · 조사 고치기) · 맞춰 보기(Quiz) · 내 타자(Typing)
  sections/             홈의 절들. Taste.tsx가 찍먹, Study.tsx가 무엇을 공부하나(과목 · 몽타주 · 신문 · 쪽지 시험)
  components/           Reader(톡 · 꾹 · 키보드) · QuizRunner · Dialog · ReviewOffBadge · Mascot · Header · Icons
  lib/                  화면을 모르는 규칙
    text.ts · gloss.ts  찍먹 — 문단 → 문장 → 낱말, 앱의 읽을거리 글 파일(`=== 문장 해석 ===`) · 풀이 · 숙어
    quiz.ts             찍먹의 뜻 적기 채점 · 섞기
    blank/              블랭크북 — josa(조사) · book(책 · 어절 · 자리) · material(따옴표 자료 · 부탁 글 · 카드 글) ·
                        pick(규칙으로 먼저 칠하기) · quiz(문제 · 채점 · 글자 차이) · typing(타수 · 등급) · store(장부) · samples
    storage.ts          localStorage 손잡이
    install.ts          오프라인 일꾼 붙이기 · 홈 화면에 두기(안드로이드 설치 단추 · 아이폰 안내)
  content/passages/     찍먹 지문(앱의 refresh_0 · 2 · 14 그대로)
  styles/               tokens.css(앱 theme.dart의 색 · 글꼴 · 본문 자) · base · home · reader · blankbook
public/
  img/                  캐릭터 다섯 × 몸짓 다섯 · 앱 아이콘 · 지문 그림 · 월드 사진(광고 13판의 에뮬레이터 원본)
  fonts/                Literata(OFL) — 앱의 본문 글꼴
public/manifest.webmanifest · icon-*.png   홈 화면에 둘 때의 이름 · 아이콘
scripts/import_assets.py   MolB 저장소에서 위의 것을 옮기고 웹에 맞게 줄인다(홈 화면 아이콘도)
scripts/sw.template.js     오프라인 일꾼의 틀 — 판 · 파일 목록은 빌드가 채운다
```

## 폰에서

- **홈 화면에 두기** — 안드로이드 크롬은 '앱 설치'(또는 바닥줄의 📲 단추), 아이폰은 사파리의 공유 → 홈 화면에 추가. 아이콘은 크림 바탕의
  다람쥐(`public/icon-*.png`, maskable 포함 — `scripts/import_assets.py`가 짓는다), 바로 가기 둘(블랭크북 · 찍먹).
- **오프라인** — `dist/sw.js`(틀은 `scripts/sw.template.js`)가 설치 때 빌드의 파일을 전부 받아 둔다(공유 미리보기 그림 · 글꼴 허가서만 뺌).
  쪽 이동은 그 판의 index.html을 곧장 주고, 나머지는 캐시 먼저. 새로 올리면 sw.js의 판(파일 내용 해시)이 바뀌어 브라우저가 새 일꾼을
  받고, 새 판을 다 받은 뒤 옛 캐시를 지운다 — 다음에 열 때 새 판이 선다. 일꾼은 빌드판 · https(또는 localhost)에서만 붙고, 붙일 수 없는 곳
  (아티팩트 뷰어 같은 샌드박스)에서는 조용히 넘어간다. Pretendard(CDN)는 안 받아 두어 오프라인이면 기기 한글 글꼴로 그린다.
- **확인한 것**(Playwright 폰 흉내 — 터치 · 320 · 360 · 412px): 가로 넘침 없음, 톡 · 꾹(길게 눌러도 글자 선택 · 메뉴가 안 뜸) · 글 위를 끌어
  굴리면 안 담김, 해석 · 공부 끝 · 뜻 적기 퀴즈, 블랭크북 예시 → 맞춰 보기(Enter로 확인 · 다음, 확인 뒤에도 칸에 머물러 자판이 안 내려감),
  새로고침 뒤 장부, 오프라인에서 다시 열기 · 블랭크북 · 찍먹 그림, 새 판 바꿔 끼우기, `/pickupjm20.com/MolBworld.com/` 하위 경로.
- 폰 자판 — 답 칸은 `enterkeyhint`(완료 · 다음 · 보내기), 영어 답의 첫 글자 대문자 · 자동 고침 끔. 손가락 기기에서는 입력 칸 글자를 16px
  아래로 안 내린다(iOS 사파리가 그보다 작은 칸을 누르면 화면을 키운다). 토스트는 폰에서 머리줄 아래로(아래쪽은 자판 · 정답 자리).

## 올리기 — GitHub Pages

`.github/workflows/molbworld.yml`이 **main**에 들어온 것을 Pages에 올린다(다른 가지 · PR은 검사 · 빌드만). 사이트는 `/MolBworld.com/`,
저장소 뿌리(`/`)는 그리로 넘겨 준다.

- 주소: `https://pickupjm20-dot.github.io/pickupjm20.com/MolBworld.com/` — pickupjm20.com 도메인을 Pages에 붙이면 `pickupjm20.com/MolBworld.com/`.
- **처음 한 번** 저장소 Settings → Pages → Build and deployment의 Source를 **GitHub Actions**로. 안 골랐으면 워크플로의 configure-pages가
  그렇다고 말하며 멈춘다.
- 손으로 다시 올리기: Actions → MolB World → Run workflow(main).

## 앱과의 관계 — 정본은 MolB

그림 · 글꼴 · 지문은 MolB 저장소의 것이다. 여기서 손으로 고치지 말고 MolB에서 고친 뒤 다시 옮긴다.

```bash
python3 scripts/import_assets.py ../../MolB   # MolB-1.4.0(또는 그 뒤) 체크아웃 경로
```

1.4.0에서 `assets/icons/new_words.png`가 빠져 스크립트도 그 아이콘을 안 옮긴다. 찍먹 지문을 바꾸려면 스크립트의 `PASSAGES`와
`src/data/passages.ts`를 같이 고친다. 색은 앱의 `lib/theme.dart`(TossColors)와 같은 값을 `src/styles/tokens.css`에 둔다.
블랭크북의 규칙(조사 · 따옴표 · 채점 · 타수)은 앱의 옛 코드를 옮긴 것이라, 앱에서 다시 살리면 같은 자로 맞춘다.

## 디자인 메모

- 앱과 같은 의미색 — 오렌지는 행동(버튼 · 빈칸), 초록은 성장(담은 단어 · 맞음), 보라는 읽기(해석 · 숙어), 코랄은 틀림.
- 본문은 앱처럼 Literata(17px · 행간 1.62 · 한 줄 34em · 문단 첫 줄 1.5em 들여쓰기), UI는 Pretendard(CDN).
- 블랭크북은 원본의 꼴(단추 · 카드 · 칩 · 입력칸)을 MolB 빛깔로 — 앱 `BlankLook`과 같다. 책 표지는 종이 빛깔 여섯을 책 id로.
- 마을의 인쇄물은 밤 테마에서도 밝은 종이(마을에 붙은 종이라서).
- 밤 테마는 차가운 검정이 아니라 불 꺼진 나무 방의 갈색. 기기 설정을 따르고, 머리줄의 달 단추로 바꾼다.
- 고른 캐릭터가 머리줄 · 히어로 · 찍먹 반응 · 블랭크북에 선다. 몰비의 말은 앱의 `docs/MOLB_CHARACTER.md` 말투(반말 · 호기심).
- 움직임 줄이기를 켠 사람에게는 떠오르기 · 흔들림을 끈다. 리더 · 칠하기는 키보드로도 쓴다.

## 남은 것

- 도메인 — GitHub Pages(위 '올리기')로 `…github.io/pickupjm20.com/MolBworld.com/`. pickupjm20.com · molbworld.com 도메인을 붙일지는
  아직이다(붙이면 Settings → Pages → Custom domain, 빌드는 그대로).
- 공유 미리보기 — `index.html`의 `og:image`는 상대 경로(`./img/og.jpg`)다. 몇몇 메신저는 절대 주소만 읽으니, 도메인이
  정해지면 `https://…/img/og.jpg`로 바꾼다.
- 1.4.0 화면 사진 — 태그 단어장 · 빈칸 퀴즈 · 마을의 인쇄물 사진이 나오면 무엇을 공부하나 절의 CSS 그림을 사진으로 바꾼다.
- Windows판 받기 링크 — 공개 주소가 없어 ‘앱 받기’는 Google Play 하나만 건다(`src/data/site.ts`의 `LINKS`).
- 블랭크북 기록 → 앱 계정으로 옮기기는 없다(JSON 내보내기까지).
- Pretendard는 CDN에서 받는다. CDN이 막히면 시스템 한글 글꼴로 떨어진다 — 직접 싣고 싶으면 `public/fonts/`로.

import { LINKS } from '../data/site';
import { useInstall } from '../lib/install';

export function Footer() {
  const { state, install } = useInstall();
  return (
    <footer className="site-footer">
      <div className="container site-footer__row">
        <div className="site-footer__brand">
          <span className="brand__name">MolB</span>
          <span className="brand__world">World</span>
          <p>공부한 만큼, 넓어지는 세상.</p>
          {state === 'prompt' && (
            <button type="button" className="btn btn--outline btn--sm site-footer__install" onClick={() => void install()}>
              📲 홈 화면에 두기 — 인터넷 없이도 돌아요
            </button>
          )}
          {state === 'ios' && (
            <p className="site-footer__install-tip">
              📲 아이폰은 사파리의 <b>공유</b> → <b>홈 화면에 추가</b>로 앱처럼 둘 수 있어요. 한 번 열면 인터넷 없이도 돌아요.
            </p>
          )}
        </div>
        <ul className="site-footer__links">
          <li>
            <a href="#/taste">지문 셋 찍먹</a>
          </li>
          <li>
            <a href="#/blankbook">블랭크북</a>
          </li>
          <li>
            <a href={LINKS.play} target="_blank" rel="noopener noreferrer">
              Google Play
            </a>
          </li>
          <li>
            <a href={LINKS.privacy} target="_blank" rel="noopener noreferrer">
              개인정보처리방침
            </a>
          </li>
        </ul>
      </div>
      <div className="container site-footer__fine">
        <p>
          MolB World는 학습 앱 MolB의 소개 사이트예요. 찍먹 · 블랭크북에서 담은 단어와 글은 서버로 가지 않고 이
          브라우저(localStorage)에만 남아요.
        </p>
        <p>
          본문 글꼴 Literata (SIL OFL 1.1) · UI 글꼴 Pretendard (SIL OFL 1.1) · 그림과 캐릭터 © MolB
        </p>
      </div>
    </footer>
  );
}

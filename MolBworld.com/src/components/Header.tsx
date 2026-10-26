import { useEffect, useRef, useState } from 'react';
import { CHARACTERS, characterImage, LINKS } from '../data/site';
import { usePrefs } from '../hooks/prefs';
import { goToSection } from '../hooks/useRoute';
import { CloseIcon, MenuIcon, MoonIcon, SunIcon } from './Icons';

const NAV = [
  { section: 'about', label: 'MolB' },
  { section: 'study', label: '무엇을 공부하나' },
  { section: 'taste', label: '찍먹' },
  { section: 'blankbook', label: '블랭크북', page: true },
  { section: 'world', label: '몰비의 세상' },
  { section: 'faq', label: '자주 묻는 것' },
];

export function Header({ page }: { page: 'home' | 'blankbook' }) {
  const { character, setCharacter, theme, toggleTheme } = usePrefs();
  const [menu, setMenu] = useState(false);
  const [picker, setPicker] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  useEffect(() => {
    if (!picker) return;
    const close = (e: PointerEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !pickerRef.current?.contains(e.target as Node)) setPicker(false);
    };
    window.addEventListener('pointerdown', close);
    window.addEventListener('keydown', close);
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', close);
    };
  }, [picker]);

  useEffect(() => {
    document.body.classList.toggle('no-scroll', menu);
  }, [menu]);

  const go = (item: (typeof NAV)[number]) => (e: React.MouseEvent) => {
    setMenu(false);
    if (item.page) return; // 블랭크북은 해시 링크 그대로
    e.preventDefault();
    goToSection(item.section);
  };

  return (
    <header className={`site-header${scrolled ? ' is-scrolled' : ''}`}>
      <div className="container site-header__row">
        <a
          className="brand"
          href="#/"
          onClick={(e) => {
            if (page === 'home') {
              e.preventDefault();
              window.history.replaceState(null, '', '#/');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        >
          <img src={characterImage(character)} alt="" width={36} height={36} className="brand__mark" />
          <span className="brand__name">MolB</span>
          <span className="brand__world">World</span>
        </a>

        <nav className={`nav${menu ? ' is-open' : ''}`} aria-label="주 메뉴">
          <ul>
            {NAV.map((item) => (
              <li key={item.section}>
                <a
                  href={`#/${item.section}`}
                  onClick={go(item)}
                  aria-current={item.page && page === 'blankbook' ? 'page' : undefined}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <a className="btn btn--primary nav__cta" href={LINKS.play} target="_blank" rel="noopener noreferrer">
            앱 받기
          </a>
        </nav>

        <div className="site-header__tools">
          <div className="picker" ref={pickerRef}>
            <button
              type="button"
              className="icon-btn picker__btn"
              aria-label="몰비 캐릭터 고르기"
              aria-expanded={picker}
              onClick={() => setPicker((v) => !v)}
            >
              <img src={characterImage(character)} alt="" width={28} height={28} />
            </button>
            {picker && (
              <div className="picker__pop" role="dialog" aria-label="몰비 캐릭터 고르기">
                <p className="picker__title">누구랑 읽을까요?</p>
                <p className="picker__sub">고른 캐릭터가 사이트 곳곳에 나와요 — 앱처럼요.</p>
                <ul className="picker__list">
                  {CHARACTERS.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        className={`picker__item${c.id === character ? ' is-on' : ''}`}
                        aria-pressed={c.id === character}
                        onClick={() => {
                          setCharacter(c.id);
                          setPicker(false);
                        }}
                      >
                        <img src={characterImage(c.id)} alt="" width={48} height={48} />
                        <span>{c.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <button
            type="button"
            className="icon-btn"
            aria-label={theme === 'dark' ? '낮 화면으로' : '밤 화면으로'}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            type="button"
            className="icon-btn nav-toggle"
            aria-label={menu ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={menu}
            onClick={() => setMenu((v) => !v)}
          >
            {menu ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>
    </header>
  );
}

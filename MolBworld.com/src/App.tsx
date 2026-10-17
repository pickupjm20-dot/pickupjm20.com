import { useEffect } from 'react';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { PrefsProvider } from './hooks/prefs';
import { scrollToSection, useRoute } from './hooks/useRoute';
import { useReveal } from './hooks/useReveal';
import { BlankBookPage } from './pages/BlankBookPage';
import { HomePage } from './pages/HomePage';

function Routes() {
  const route = useRoute();
  useReveal(route.page);

  useEffect(() => {
    if (route.page === 'home' && route.section) scrollToSection(route.section);
    else window.scrollTo({ top: 0 });
  }, [route.page, route.section]);

  useEffect(() => {
    document.title = route.page === 'blankbook' ? '블랭크북 — MolB World' : 'MolB World — 읽은 만큼, 넓어지는 세상';
  }, [route.page]);

  return (
    <>
      <a className="skip-link" href="#main">
        본문으로 건너뛰기
      </a>
      <Header page={route.page} />
      <main id="main" tabIndex={-1}>
        {route.page === 'blankbook' ? <BlankBookPage /> : <HomePage />}
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <PrefsProvider>
      <Routes />
    </PrefsProvider>
  );
}

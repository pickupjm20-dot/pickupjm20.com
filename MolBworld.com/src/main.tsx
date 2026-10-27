import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { startOffline } from './lib/install';
import './styles/tokens.css';
import './styles/base.css';
import './styles/home.css';
import './styles/reader.css';
import './styles/blankbook.css';

startOffline();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

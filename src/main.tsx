import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import { RouterProvider, useRouter } from './lib/router';
import Home from './pages/Home';
import About from './pages/About';
import Work from './pages/Work';
import CaseStudy from './pages/CaseStudy';
import Craft from './pages/Craft';

function App() {
  const { path } = useRouter();
  if (path === '/about') return <About />;
  if (path === '/work')  return <Work />;
  if (path === '/craft') return <Craft />;
  const caseMatch = path.match(/^\/work\/(.+)$/);
  if (caseMatch) return <CaseStudy slug={caseMatch[1]} />;
  return <Home />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider>
      <App />
    </RouterProvider>
  </React.StrictMode>,
);

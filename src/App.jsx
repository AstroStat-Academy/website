import React from 'react';
import { routes } from './routes.js';
import { PageHome } from './pages/Home.jsx';
import { Schools } from './pages/Schools.jsx';
import { People } from './pages/People.jsx';
import { Gallery } from './pages/Gallery.jsx';
import { PageAcknowledge } from './pages/Acknowledge.jsx';
import { HeroConsole, PH_CTX } from './components/ServiceHero.jsx';
import { SiteNav, SiteFooter } from './components/SiteChrome.jsx';
import { PageHeader } from '../components/PageHeader/PageHeader.jsx';

export function App() {
  const route = routes.find(item => item.path === window.location.pathname);
  if (!route) return <div className="as-page">
    <SiteNav active={null} />
    <main id="main-content" className="as-wrap">
      <PageHeader section="404" kicker="page not found" title="Page not found" lede="The page you requested is unavailable.">
        <p><a className="as-btn ghost" href="/">Return home →</a></p>
      </PageHeader>
    </main>
    <SiteFooter />
  </div>;

  const pages = { home: PageHome, schools: Schools, people: People, gallery: Gallery, acknowledge: PageAcknowledge };
  const Page = pages[route.id];
  return Page ? <Page /> : <HeroConsole ctx={PH_CTX[route.id]} />;
}

import { PageHeader } from '../../components/PageHeader/PageHeader.jsx';
import React from 'react';
import { SiteNav, SiteFooter } from './SiteChrome.jsx';
/* Page hero + contact block for Schools / Consulting / Hackatons.
   Left: a short intro to what the offering is.
   Right: an "open channel" transmission card inviting people to get in touch
   about co-organising an event. Accent + copy adapt per page.
   Uses the shared PageHeader and site chrome. */



/* Click-to-copy CTA button — copies the email and flashes a confirmation. */
function ContactCTA({ email, label }) {
  const [copied, setCopied] = React.useState(false);
  const t = React.useRef(null);
  const onCopy = () => {
    try {
      if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(email); }
      else { throw new Error('fallback'); }
    } catch (e) {
      try {
        const ta = document.createElement('textarea');
        ta.value = email; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.focus(); ta.select();
        document.execCommand('copy'); document.body.removeChild(ta);
      } catch (e2) { /* ignore */ }
    }
    setCopied(true);
    clearTimeout(t.current);
    t.current = setTimeout(() => setCopied(false), 2000);
  };
  React.useEffect(() => () => clearTimeout(t.current), []);
  return (
    <span className="ph-cta-wrap">
      <span className={'ph-toast' + (copied ? ' show' : '')}>Email address copied to clipboard</span>
      <button type="button" className="as-btn solid ph-cta" onClick={onCopy}>{label} ✉</button>
    </span>
  );
}

/* Per-page contexts — same block, accent + copy adapt. */
const PH_CTX = {
  schools: {
    active: 'schools', accent: 'blue',
    eyebrow: 'Schools',
    title: 'Hands-on schools in\nstatistics and AI',
    lede: <>Intensive schools where working researchers and data scientists learn the <span className="b">statistical methods</span> behind modern surveys.</>,
    cTitle: 'Bring a school to your institute',
    cBody: 'We partner with departments, observatories and research groups to run editions tuned to your science. Tell us what you have in mind.',
    cta: 'Propose an edition',
  },
  consulting: {
    active: 'consulting', accent: 'blue',
    eyebrow: 'Consulting',
    title: 'Statistical and AI consulting\nfor corporate',
    lede: <>Embedded statistical support for <span className="b">R&D projects</span> — from study design to inference.</>,
    cTitle: 'Have a problem that needs an expert?',
    cBody: 'Tell us about your program — survey design, model choice or a pipeline that needs a second pair of eyes — and we\'ll scope how we can help.',
    cta: 'Start a conversation',
  },
  hackatons: {
    active: 'hackatons', accent: 'red',
    eyebrow: 'Hackatons',
    title: 'Collaborative\ndata hackatons',
    lede: <>Focused sprints where <span className="b">data scientists</span> tackle a shared dataset side by side — ideal for team building.</>,
    cTitle: 'Want to run a hackaton with your team?',
    cBody: 'Bring a dataset and a question. We help design the sprint, recruit assistants, and facilitate the event end to end.',
    cta: 'Propose a hackaton',
  },
};

/* The hero panel itself (no page wrapper / nav) — reusable so it can be
   dropped at the top of an existing page too. */
function HeroPanel({ ctx }) {
  const c = ctx;
  return (
      <PageHeader section={c.eyebrow} kicker="what we run" title={c.title} lede={c.lede} accent={c.accent}
        channel="// AstroStat Academy" status={<>channel <b>open</b> · accepting proposals</>}
        aside={
          <div className="ph-tx">
            <div className="ph-tx-top">
              <span className="ph-tx-led"><i></i>open channel</span>
              <span>enc · tls</span>
            </div>
            <div className="ph-tx-body">
              <div className="ph-tx-title">{c.cTitle}</div>
              <div className="ph-tx-sub">{c.cBody}</div>
              <div className="ph-tx-input">Tell us about your group and what you'd like to do<span className="as-cur"></span></div>
              <div className="ph-tx-foot">
                <span className="ph-tx-mail">astrostatacademy@gmail.com</span>
                <ContactCTA email="astrostatacademy@gmail.com" label={c.cta} />
              </div>
            </div>
          </div>
        }
      />
  );
}

/* Page hero — left intro, right "open channel" transmission card. */
function HeroConsole({ ctx }) {
  const c = ctx;
  return (
    <div className="as-page">
      <SiteNav active={c.active} />
      <main id="main-content" className="as-wrap"><HeroPanel ctx={c} /></main>
      <SiteFooter />
    </div>
  );
}


export { PH_CTX, HeroPanel, HeroConsole };

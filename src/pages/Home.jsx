import { PageHeader } from '../../components/PageHeader/PageHeader.jsx';
import React from 'react';
import { SiteNav, SiteFooter, Corners, Rail, RailMatrix } from '../components/SiteChrome.jsx';
import { CodeRainBG, HeroWidget, HeroControls, ParamSlider, AstroTerminal, TIME_SERIES_CONTROLS } from '../components/Effects.jsx';
/* Home — the approved hero, continued into What we do / Who we are / Why we exist. */
function PageHome({ railVariant = 'matrix' }) {
  const [mode, setMode] = React.useState('ts');
  const [ro, setRo] = React.useState({ alpha: 2, beta: 2 });
  const [ts, setTs] = React.useState({ phi: TIME_SERIES_CONTROLS.phi.initial, noise: TIME_SERIES_CONTROLS.noise.initial });
  return (
    <div className="as-page">
      <SiteNav active="home" />
      <main id="main-content" className="as-wrap">
        <div className="as-panel"><Corners />
          {/* hero */}
          <div className="as-hero">
            <div className="as-rain"><CodeRainBG color="#8c0527" alpha={0.4} /></div>
            <PageHeader variant="home" section="Home" kicker="// advanced statistics. taught and applied." title={'AstroStat\nAcademy'} lede={<>Take <span className="b">control</span> of your statistics.</>}>
              <div className="as-ctrl">
                <HeroControls mode={mode} onMode={setMode} />
                {mode === 'hist' ? <>
                  <ParamSlider label="α" value={ro.alpha} min={0.5} max={3.5} onChange={(v) => setRo(r => ({ ...r, alpha: v }))} />
                  <ParamSlider label="β" value={ro.beta} min={0.5} max={3.5} onChange={(v) => setRo(r => ({ ...r, beta: v }))} />
                </> : <>
                  <ParamSlider label="φ" value={ts.phi} min={TIME_SERIES_CONTROLS.phi.min} max={TIME_SERIES_CONTROLS.phi.max} onChange={(v) => setTs(t => ({ ...t, phi: v }))} />
                  <ParamSlider label="σ" value={ts.noise} min={TIME_SERIES_CONTROLS.noise.min} max={TIME_SERIES_CONTROLS.noise.max} onChange={(v) => setTs(t => ({ ...t, noise: v }))} />
                </>}
              </div>
              <p className="as-about">We teach and mentor researchers and teams, carrying methods proven in research into practice — tuned to what each one actually needs.</p>
            </PageHeader>
            <div className="as-hero-r">
              <div className="as-figtop">Fig. {mode === 'ts' ? '01' : '02'} — {mode === 'ts' ? 'Time series' : 'Beta distribution'}</div>
              <div className="as-home-figure">
                <HeroWidget hideToggle hideGrips mode={mode} onMode={setMode} alpha={ro.alpha} beta={ro.beta} phi={ts.phi} noise={ts.noise} onReadout={(a, b) => setRo({ alpha: a, beta: b })} accent="#0465ad" data="#8c0527" w={960} h={640} />
              </div>
            </div>
          </div>

          {/* vision */}
          <Rail n="01" label="Where we're headed" variant={railVariant} keyword="vision">
            <h2 className="as-h2">Our Vision</h2>
            <p className="as-vision">We cultivate the statistical <span className="b">mastery and judgement</span> to turn information into knowledge, and navigate a world flooded by fast but unreliable answers.</p>
          </Rail>

          {/* the problem */}
          <Rail n="02" label="Why it matters" accent="red" variant={railVariant} keyword="problem">
            <div className="as-band-split" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 28, flexWrap: 'nowrap' }}>
              <div style={{ flex: '0 0 50%', minWidth: 0 }}>
                <h2 className="as-h2">The Problem</h2>
                <p className="as-p">Whether you publish papers or bet budgets on a model, you have more tools and faster answers than ever — AutoML, dashboards, generative models that will write the analysis for you. But <span style={{ color: '#fbf6ec', fontWeight: 600 }}>a confident output is not a correct one</span>. Lean on methods you can't interrogate and you can't defend the result to a reviewer or a board, reproduce it next year, or tell a real effect from noise — and either way, your name is on it.</p>
              </div>
              <div className="as-void-viz" style={{ flex: '0 0 40%', minWidth: 0 }}><AstroTerminal accent="#c8607a" w="100%" /></div>
            </div>
          </Rail>

          {/* our mission */}
          <Rail n="03" label="Why we teach" variant={railVariant} keyword="why">
            <h2 className="as-h2">Our Mission</h2>
            <p className="as-p">We're an educational organization — we teach you <span style={{ color: '#fbf6ec', fontWeight: 600 }}>to do the analysis yourself, and to interpret and question the answers your tools hand back</span>, rather than take them at face value.</p>
          </Rail>

          {/* what we do */}
          <Rail n="04" label="What we do" accent="red" variant={railVariant} keyword="do">
            <div className="as-band-split" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
              <div style={{ flex: '0 0 50%', minWidth: 280 }}>
                <h2 className="as-h2">Our Activities</h2>
                <p className="as-p">From intensive residential schools to applied consulting, we meet statistical problems wherever they live — across research and industry alike.</p>
              </div>
              <div className="as-modrow" style={{ flex: '0 0 auto' }}>
                <a href="/schools/" className="as-mod" style={{ '--mc': '#d06f86' }}><div className="mtop"><span>MOD·01</span><RailMatrix accent="red" cols={3} rows={1} phase={0} speed={500} /></div><div className="mnm">Schools</div><div className="mds">For data professionals</div></a>
                <a href="/hackathons/" className="as-mod" style={{ '--mc': '#3b9be0' }}><div className="mtop"><span>MOD·02</span><RailMatrix accent="blue" cols={3} rows={1} phase={3} speed={500} /></div><div className="mnm">Hackatons</div><div className="mds">For teams</div></a>
                <a href="/consulting/" className="as-mod" style={{ '--mc': '#d06f86' }}><div className="mtop"><span>MOD·03</span><RailMatrix accent="red" cols={3} rows={1} phase={6} speed={500} /></div><div className="mnm">Consulting</div><div className="mds">For organizations</div></a>
              </div>
            </div>
          </Rail>

          {/* our expertise */}
          <Rail n="05" label="What we know" variant={railVariant} keyword="expertise">
            <h2 className="as-h2">Our Expertise</h2>
            <p className="as-p">The statistical and machine-learning methods we teach, apply, and research — chosen to fit each problem, not the other way around.</p>
            <div className="as-methods">
              <div className="as-mrow"><span className="mk top">Statistics</span><span className="mv chips"><span className="mc">Hypothesis Testing</span><span className="mc">Classical and Bayesian inference</span><span className="mc">MCMC</span><span className="mc">Gaussian Processes</span></span></div>
              <div className="as-mrow red"><span className="mk top">Machine Learning</span><span className="mv chips"><span className="mc">Classification</span><span className="mc">Clustering</span><span className="mc">Dimensionality Reduction</span><span className="mc">Feature Analysis</span></span></div>
              <div className="as-mrow"><span className="mk top">Deep Learning</span><span className="mv chips"><span className="mc">Convolutional Nets</span><span className="mc">Autoencoding</span><span className="mc">Transformers</span><span className="mc">LLMs</span><span className="mc">AI Agents</span></span></div>
              <div className="as-methods-more">and many more<span className="as-cur"></span></div>
            </div>
          </Rail>

          {/* who we are */}
          <Rail n="06" label="Who we are" accent="red" variant={railVariant} keyword="who">
            <h2 className="as-h2">The Team</h2>
            <p className="as-p">A collective of working Researchers, Data Scientists and Machine-Learning experts drawn from academic institutes and companies across Europe.</p>
            <div style={{ marginTop: 20 }}><a href="/people/" className="as-btn ghost">Meet our people →</a></div>
          </Rail>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export { PageHome };

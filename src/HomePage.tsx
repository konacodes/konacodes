import { useEffect, useState } from 'react';
import './homepage.css';

const projects = [
  { name: 'DUCK LANG', desc: 'Say "quack" or the goose won\'t run your code.', href: 'https://github.com/konacodes/duck-lang', rot: '-3deg' },
  { name: 'BLOG CMS', desc: 'Markdown-first. Cloudflare Workers + D1.', href: 'https://blog.kcodes.me', rot: '2deg' },
  { name: 'FILMS CMS', desc: 'Tracking everything watched.', href: 'https://films.kcodes.me', rot: '-1deg' },
  { name: 'LIKWID', desc: 'Real-time fluid simulations as ASCII art in your terminal.', href: 'https://github.com/konacodes/likwid', rot: '1.5deg' },
  { name: 'NULL', desc: 'Built by Claude. It worked until it didn\'t.', href: 'https://github.com/konacodes/null', rot: '3.5deg' },
];

export function HomePage() {
  const [scattered, setScattered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setScattered(true), 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="cz-page">
      {/* Hero with scatter animation */}
      <section className="cz-hero">
        {/* Complete image shown first, then shatters */}
        <img
          src="/images/light-bg-hero-section.png"
          alt="KONA"
          className={`cz-hero-complete ${scattered ? 'shattered' : ''}`}
        />

        {/* Scattered fragments that appear after shatter */}
        <div className={`cz-frags ${scattered ? 'active' : ''}`}>
          <div className="cz-frag cz-frag--1" style={{ backgroundImage: 'url(/images/light-bg-hero-section.png)' }} />
          <div className="cz-frag cz-frag--2" style={{ backgroundImage: 'url(/images/light-bg-hero-section.png)' }} />
          <div className="cz-frag cz-frag--3" style={{ backgroundImage: 'url(/images/light-bg-hero-section.png)' }} />
          <div className="cz-frag cz-frag--4" style={{ backgroundImage: 'url(/images/light-bg-hero-section.png)' }} />
          <div className="cz-frag cz-frag--5" style={{ backgroundImage: 'url(/images/light-bg-hero-section.png)' }} />

          {/* Watercolor pieces */}
          <div className="cz-wash-piece cz-wash-piece--1" style={{ backgroundImage: 'url(/images/light-bg-no-text.png)' }} />
          <div className="cz-wash-piece cz-wash-piece--2" style={{ backgroundImage: 'url(/images/light-bg-no-text.png)' }} />
        </div>
      </section>

      {/* Ransom note tagline */}
      <div className="cz-ransom">
        <span className="cz-ransom-word">I</span>
        <span className="cz-ransom-word">build</span>
        <span className="cz-ransom-word">things</span>
        <span className="cz-ransom-word">for</span>
        <span className="cz-ransom-word">the web</span>
      </div>

      <div className="cz-content">
        {/* About */}
        <div className="cz-section--paper" style={{ '--rot': '-1deg' } as React.CSSProperties}>
          <h2 className="cz-heading">ABOUT ME</h2>
          <p className="cz-about-text">
            Self-taught developer who learned by{' '}
            <span className="highlight">breaking things</span>.{' '}
            <span className="crossed">formally educated</span>{' '}
            <span className="scrawl">nah, self-taught!</span>
            <br />
            Film nerd. Music lover. History enthusiast.
          </p>
        </div>

        {/* Mid-content hero fragment */}
        <div className="cz-mid-frag cz-mid-frag--1" style={{ backgroundImage: 'url(/images/light-bg-hero-section.png)' }} />

        {/* Philosophy */}
        <div className="cz-philosophy">
          "Ship it <span className="underline">raw</span>.<br />
          Done &gt; perfect."
        </div>

        {/* Projects */}
        <h2 className="cz-heading" style={{ marginLeft: '1rem' }}>BUILDS</h2>
        <div className="cz-projects">
          {projects.map(p => (
            <a key={p.name} href={p.href} target="_blank" rel="noopener noreferrer"
              className="cz-project" style={{ '--rot': p.rot } as React.CSSProperties}>
              <h3 className="cz-project-name">{p.name}</h3>
              <p className="cz-project-desc">{p.desc}</p>
            </a>
          ))}
        </div>

        {/* Another mid-content fragment */}
        <div className="cz-mid-frag cz-mid-frag--2" style={{ backgroundImage: 'url(/images/light-bg-hero-section.png)' }} />

        {/* Connect */}
        <nav className="cz-connect">
          {[
            { name: 'BLOG', href: 'https://blog.kcodes.me', r: '-2deg' },
            { name: 'FILMS', href: 'https://films.kcodes.me', r: '1.5deg' },
            { name: 'GITHUB', href: 'https://github.com/konacodes', r: '-1deg' },
            { name: 'DISCORD', href: 'https://discord.com/users/1151230208783945818', r: '2.5deg' },
            { name: 'EMAIL', href: 'mailto:hello@kcodes.me', r: '-3deg' },
          ].map(l => (
            <a key={l.name} href={l.href} target="_blank" rel="noopener noreferrer"
              className="cz-connect-link" style={{ '--rot': l.r } as React.CSSProperties}>
              {l.name}
            </a>
          ))}
        </nav>
      </div>

      <footer className="cz-footer">
        {new Date().getFullYear()} * photocopied with questionable sleep habits
      </footer>
    </div>
  );
}

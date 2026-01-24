import { useEffect, useRef, useState } from "react";
import "./index.css";

// ============================================
// Spotlight Effect - The Signature Element
// ============================================
function Spotlight() {
  const spotlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const spotlight = spotlightRef.current;
    if (!spotlight) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let currentX = mouseX;
    let currentY = mouseY;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const animate = () => {
      currentX += (mouseX - currentX) * 0.08;
      currentY += (mouseY - currentY) * 0.08;

      spotlight.style.setProperty('--x', `${currentX}px`);
      spotlight.style.setProperty('--y', `${currentY}px`);

      requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    animate();

    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      ref={spotlightRef}
      className="spotlight"
      aria-hidden="true"
    />
  );
}

// ============================================
// Time Display
// ============================================
function TimeDisplay() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatted = time.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <time className="dateline" dateTime={time.toISOString()}>
      {formatted}
    </time>
  );
}

// ============================================
// Labs Page
// ============================================
function LabsPage() {
  const projects = [
    {
      id: 'duck',
      title: 'Duck Lang',
      description: 'A programming language where you have to say "quack" or the goose won\'t run your code. The goose has opinions and rates your code from 1-10.',
      tech: ['Rust'],
      href: 'https://github.com/konacodes/duck-lang',
      status: 'active'
    },
    {
      id: 'null',
      title: 'null',
      description: 'An experiment built entirely by Claude. It worked until it didn\'t. We don\'t talk about what happened at the very end.',
      tech: ['TypeScript', 'Claude'],
      href: 'https://github.com/konacodes/null',
      status: 'archived'
    },
    {
      id: 'blog-cms',
      title: 'Blog CMS',
      description: 'Markdown-first content management running on Cloudflare Workers + D1. Fast, minimal, no bloat.',
      tech: ['Cloudflare Workers', 'D1'],
      href: 'https://blog.kcodes.me',
      status: 'active'
    },
    {
      id: 'films-cms',
      title: 'Films CMS',
      description: 'A catalog system for tracking everything I\'ve watched. Same stack as the blog.',
      tech: ['Cloudflare Workers', 'D1'],
      href: 'https://films.kcodes.me',
      status: 'active'
    },
    {
      id: 'this-site',
      title: 'This Site',
      description: 'The editorial-style portfolio you\'re looking at right now. Spotlight follows your cursor.',
      tech: ['React', 'Vite', 'Vibes'],
      href: 'https://github.com/konacodes/konacodes',
      status: 'active'
    },
  ];

  return (
    <div className="page">
      <Spotlight />

      <header className="labs-header">
        <a href="/" className="back-link">← Back</a>
        <h1 className="labs-title">Labs</h1>
        <p className="labs-subtitle">Projects, experiments, and happy accidents</p>
      </header>

      <main className="labs-grid">
        {projects.map((project) => (
          <a
            key={project.id}
            href={project.href}
            target={project.href.startsWith('http') ? '_blank' : undefined}
            rel={project.href.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="project-card"
          >
            <div className="project-header">
              <h2 className="project-title">{project.title}</h2>
              {project.status === 'archived' && (
                <span className="project-status">archived</span>
              )}
            </div>
            <p className="project-description">{project.description}</p>
            <div className="project-tech">
              {project.tech.map((t) => (
                <span key={t} className="tech-tag">{t}</span>
              ))}
            </div>
          </a>
        ))}
      </main>

      <footer className="footer">
        <div className="footer-rule" />
        <p className="footer-text">
          <span className="footer-year">{new Date().getFullYear()}</span>
          <span className="footer-divider">·</span>
          <span>Made with questionable sleep habits</span>
        </p>
      </footer>
    </div>
  );
}

// ============================================
// Home Page
// ============================================
function HomePage() {
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  const links = [
    {
      id: 'blog',
      title: 'Blog',
      subtitle: 'Thoughts, notes, and occasional rants',
      href: 'https://blog.kcodes.me',
    },
    {
      id: 'films',
      title: 'Films',
      subtitle: 'A catalog of everything I\'ve watched',
      href: 'https://films.kcodes.me',
    },
    {
      id: 'labs',
      title: 'Labs',
      subtitle: 'Projects, experiments, and happy accidents',
      href: '/labs',
    },
  ];

  const socials = [
    { name: 'GitHub', href: 'https://github.com/konacodes' },
    { name: 'Discord', href: 'https://discord.com/users/1151230208783945818' },
    { name: 'Email', href: 'mailto:hello@kcodes.me' },
  ];

  return (
    <div className="page">
      <Spotlight />

      <header className="masthead">
        <div className="masthead-rule" />
        <h1 className="masthead-title">Kona</h1>
        <p className="masthead-tagline">creative developer</p>
        <div className="masthead-rule" />
        <TimeDisplay />
      </header>

      <main className="content">
        <nav className="headlines">
          {links.map((link, index) => (
            <a
              key={link.id}
              href={link.href}
              className={`headline ${hoveredLink && hoveredLink !== link.id ? 'faded' : ''}`}
              target={link.href.startsWith('http') ? '_blank' : undefined}
              rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              onMouseEnter={() => setHoveredLink(link.id)}
              onMouseLeave={() => setHoveredLink(null)}
              style={{ '--delay': `${index * 0.1}s` } as React.CSSProperties}
            >
              <h2 className="headline-title">{link.title}</h2>
              <p className="headline-subtitle">{link.subtitle}</p>
            </a>
          ))}
        </nav>

        <aside className="sidebar">
          <div className="sidebar-section">
            <h3 className="sidebar-heading">About</h3>
            <p className="sidebar-text">
              Self-taught developer who learned by breaking things.
              Film nerd, music lover, history enthusiast.
              Also a protogen.
            </p>
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-heading">Philosophy</h3>
            <p className="sidebar-text italic">
              "Ship it raw. Done &gt; perfect."
            </p>
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-heading">Connect</h3>
            <ul className="sidebar-links">
              {socials.map((social) => (
                <li key={social.name}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sidebar-link"
                  >
                    {social.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </main>

      <footer className="footer">
        <div className="footer-rule" />
        <p className="footer-text">
          <span className="footer-year">{new Date().getFullYear()}</span>
          <span className="footer-divider">·</span>
          <span>Made with questionable sleep habits</span>
        </p>
      </footer>
    </div>
  );
}

// ============================================
// Router
// ============================================
function useRoute() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (anchor && anchor.href.startsWith(window.location.origin)) {
        const url = new URL(anchor.href);
        // Only handle internal non-blog/films routes
        if (url.pathname === '/' || url.pathname === '/labs') {
          e.preventDefault();
          window.history.pushState({}, '', url.pathname);
          setPath(url.pathname);
          window.scrollTo(0, 0);
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return path;
}

// ============================================
// Main App
// ============================================
export function App() {
  const path = useRoute();

  if (path === '/labs') {
    return <LabsPage />;
  }

  return <HomePage />;
}

export default App;

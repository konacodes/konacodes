import { useEffect, useRef, useState, createContext, useContext, useCallback } from "react";
import "./index.css";

// ============================================
// Theme Context
// ============================================
type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: (e: React.MouseEvent) => void;
  isAnimating: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme') as Theme;
      if (stored) return stored;
    }
    return 'dark';
  });

  const [isAnimating, setIsAnimating] = useState(false);
  const [splashOrigin, setSplashOrigin] = useState({ x: 0, y: 0 });
  const [pendingTheme, setPendingTheme] = useState<Theme | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback((e: React.MouseEvent) => {
    if (isAnimating) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    setSplashOrigin({ x, y });
    setPendingTheme(theme === 'light' ? 'dark' : 'light');
    setIsAnimating(true);
  }, [theme, isAnimating]);

  // Handle animation completion
  useEffect(() => {
    if (isAnimating && pendingTheme) {
      const timer = setTimeout(() => {
        setTheme(pendingTheme);
        setPendingTheme(null);

        // Small delay before removing animation state
        setTimeout(() => {
          setIsAnimating(false);
        }, 50);
      }, 600); // Match CSS animation duration

      return () => clearTimeout(timer);
    }
  }, [isAnimating, pendingTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isAnimating }}>
      {children}
      {/* Splash overlay for theme transition */}
      {isAnimating && pendingTheme && (
        <div
          className={`theme-splash theme-splash-${pendingTheme}`}
          style={{
            '--splash-x': `${splashOrigin.x}px`,
            '--splash-y': `${splashOrigin.y}px`,
          } as React.CSSProperties}
        />
      )}
    </ThemeContext.Provider>
  );
}

// ============================================
// Theme Toggle Button
// ============================================
function ThemeToggle() {
  const { theme, toggleTheme, isAnimating } = useTheme();

  return (
    <button
      className={`theme-toggle ${isAnimating ? 'animating' : ''}`}
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      disabled={isAnimating}
    >
      <span className="theme-toggle-icon">
        {theme === 'light' ? (
          // Moon icon
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        ) : (
          // Sun icon
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        )}
      </span>
    </button>
  );
}


// ============================================
// Now Page
// ============================================
function NowPage() {
  const { theme } = useTheme();
  return (
    <div className="page">
      <ThemeToggle />

      <header className="subpage-header">
        <a href="/" className="back-link">← Back</a>
        <h1 className="subpage-title">Now</h1>
        <p className="subpage-subtitle">What I'm up to these days</p>
        <time className="last-updated">Last updated: January 2025</time>
      </header>

      <main className="now-content">
        <section className="now-section">
          <h2 className="now-heading">Working on</h2>
          <ul className="now-list">
            <li>Building out this portfolio site</li>
            <li>Duck Lang — a programming language where you say "quack"</li>
            <li>Various Cloudflare Workers experiments</li>
          </ul>
        </section>

        <section className="now-section">
          <h2 className="now-heading">Watching</h2>
          <ul className="now-list">
            <li>Rewatching old films for the catalog</li>
            <li>Whatever catches my eye on Letterboxd</li>
          </ul>
        </section>

        <section className="now-section">
          <h2 className="now-heading">Listening to</h2>
          <ul className="now-list">
            <li>A lot of ambient and electronic stuff</li>
            <li>Podcast backlog that never shrinks</li>
          </ul>
        </section>

        <section className="now-section">
          <h2 className="now-heading">Reading</h2>
          <ul className="now-list">
            <li>Technical docs, always</li>
            <li>History books when I get the chance</li>
          </ul>
        </section>

        <p className="now-note">
          This is a <a href="https://nownownow.com/about" target="_blank" rel="noopener noreferrer">/now page</a>.
          You should make one too.
        </p>
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
// Uses Page
// ============================================
function UsesPage() {
  const { theme } = useTheme();
  const categories = [
    {
      title: 'Editor & Terminal',
      items: [
        { name: 'VS Code', note: 'with vim keybindings' },
        { name: 'Cursor', note: 'for AI-assisted coding' },
        { name: 'iTerm2', note: 'with tmux' },
        { name: 'zsh', note: 'with oh-my-zsh' },
      ]
    },
    {
      title: 'Dev Tools',
      items: [
        { name: 'Bun', note: 'faster than Node, no regrets' },
        { name: 'Git', note: 'obviously' },
        { name: 'GitHub', note: 'for everything' },
        { name: 'Cloudflare', note: 'Workers, D1, Pages' },
      ]
    },
    {
      title: 'Languages',
      items: [
        { name: 'TypeScript', note: 'daily driver' },
        { name: 'Rust', note: 'for fun and systems stuff' },
        { name: 'Python', note: 'when I need it' },
      ]
    },
    {
      title: 'Apps',
      items: [
        { name: 'Arc', note: 'browser of choice' },
        { name: 'Raycast', note: 'replaced Spotlight entirely' },
        { name: 'Discord', note: 'always open' },
        { name: 'Notion', note: 'for notes and planning' },
      ]
    },
    {
      title: 'Hardware',
      items: [
        { name: 'MacBook Pro', note: 'M-series' },
        { name: 'Mechanical keyboard', note: 'clicky sounds are essential' },
      ]
    },
  ];

  return (
    <div className="page">
      <ThemeToggle />

      <header className="subpage-header">
        <a href="/" className="back-link">← Back</a>
        <h1 className="subpage-title">Uses</h1>
        <p className="subpage-subtitle">Tools, software, and setup</p>
      </header>

      <main className="uses-content">
        {categories.map((category) => (
          <section key={category.title} className="uses-section">
            <h2 className="uses-heading">{category.title}</h2>
            <ul className="uses-list">
              {category.items.map((item) => (
                <li key={item.name} className="uses-item">
                  <span className="uses-name">{item.name}</span>
                  {item.note && <span className="uses-note">— {item.note}</span>}
                </li>
              ))}
            </ul>
          </section>
        ))}

        <p className="uses-note-footer">
          Inspired by <a href="https://uses.tech" target="_blank" rel="noopener noreferrer">uses.tech</a>
        </p>
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
// Labs Page
// ============================================
function LabsPage() {
  const { theme } = useTheme();
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
      description: 'The portfolio site you\'re looking at right now. Warm collage layout.',
      tech: ['React', 'Vite', 'Vibes'],
      href: 'https://github.com/konacodes/konacodes',
      status: 'active'
    },
  ];

  return (
    <div className="page">
      <ThemeToggle />

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
// ============================================
// Intersection Observer Hook for Collage Pieces
// ============================================
function useInView() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return { ref, visible };
}

function CollagePiece({ className, delay, children }: {
  className: string;
  delay?: number;
  children: React.ReactNode;
}) {
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      className={`piece ${className} ${visible ? 'visible' : ''}`}
      style={delay ? { transitionDelay: `${delay}ms` } as React.CSSProperties : undefined}
    >
      {children}
    </div>
  );
}

function HomePage() {
  const { theme } = useTheme();

  return (
    <div className="page collage-page">
      <ThemeToggle />

      <header className="collage-hero">
        <h1 className="collage-hero-name">Kona</h1>
      </header>

      <main className="pieces">
        <CollagePiece className="piece-blog" delay={0}>
          <a href="https://blog.kcodes.me" target="_blank" rel="noopener noreferrer" className="card">
            <div className="card-label">Writing</div>
            <h2 className="card-name">Blog</h2>
            <p className="card-desc">Thoughts, notes, and occasional rants about building things on the web.</p>
          </a>
        </CollagePiece>

        <CollagePiece className="piece-films" delay={80}>
          <a href="https://films.kcodes.me" target="_blank" rel="noopener noreferrer" className="card">
            <div className="card-label">Catalog</div>
            <h2 className="card-name">Films</h2>
            <p className="card-desc">A catalog of everything I've watched</p>
          </a>
        </CollagePiece>

        <CollagePiece className="piece-labs" delay={160}>
          <a href="/labs" className="card">
            <div className="card-label">Projects</div>
            <h2 className="card-name">Labs</h2>
            <p className="card-desc">Experiments and happy accidents</p>
          </a>
        </CollagePiece>

        <CollagePiece className="piece-about" delay={100}>
          <div className="card card-about">
            <div className="card-label">About</div>
            <p>Self-taught developer who learned by <em>breaking things</em>. Film nerd, music lover, history enthusiast. Also a protogen.</p>
          </div>
        </CollagePiece>

        <CollagePiece className="piece-philosophy" delay={180}>
          <div className="card card-philosophy">
            <blockquote>"Ship it raw.<br />Done&nbsp;&gt;&nbsp;perfect."</blockquote>
          </div>
        </CollagePiece>

        <CollagePiece className="piece-connect" delay={120}>
          <div className="card">
            <div className="card-label">Connect</div>
            <ul className="connect-list">
              <li><a href="https://github.com/konacodes" target="_blank" rel="noopener noreferrer">GitHub</a></li>
              <li><a href="https://discord.com/users/1151230208783945818" target="_blank" rel="noopener noreferrer">Discord</a></li>
              <li><a href="mailto:hello@kcodes.me">hello@kcodes.me</a></li>
            </ul>
          </div>
        </CollagePiece>

        <CollagePiece className="piece-pages" delay={200}>
          <div className="pages-row">
            <a href="/now" className="page-chip">
              <div className="chip-name">Now</div>
              <div className="chip-sub">What I'm up to</div>
            </a>
            <a href="/uses" className="page-chip">
              <div className="chip-name">Uses</div>
              <div className="chip-sub">Tools &amp; setup</div>
            </a>
          </div>
        </CollagePiece>
      </main>

      <footer className="footer collage-footer">
        <p className="footer-text">
          <span className="footer-year">{new Date().getFullYear()}</span>
          <span className="footer-divider">&middot;</span>
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
        if (url.pathname === '/' || url.pathname === '/labs' || url.pathname === '/now' || url.pathname === '/uses') {
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

  const renderPage = () => {
    switch (path) {
      case '/labs': return <LabsPage />;
      case '/now': return <NowPage />;
      case '/uses': return <UsesPage />;
      default: return <HomePage />;
    }
  };

  return (
    <ThemeProvider>
      {renderPage()}
    </ThemeProvider>
  );
}

export default App;

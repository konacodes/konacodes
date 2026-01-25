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
      <ThemeToggle />

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

  return (
    <ThemeProvider>
      {path === '/labs' ? <LabsPage /> : <HomePage />}
    </ThemeProvider>
  );
}

export default App;

// Shared styles matching kcodes.me theme
export const baseStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Rock+Salt&family=Space+Grotesk:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap');

  :root {
    --font-display: 'Rock Salt', cursive;
    --font-sans: 'Space Grotesk', system-ui, sans-serif;
    --font-serif: 'Playfair Display', Georgia, serif;
    --font-mono: 'JetBrains Mono', monospace;
    --color-bg: #f8f5f0;
    --color-ink: #1a1a18;
    --color-ink-light: #4a4a45;
    --color-ink-lighter: #8a8a82;
    --color-accent: #c9a66b;
    --color-accent-light: #d4b078;
    --color-rule: #d4d0c8;
    --color-text: var(--color-ink);
    --color-text-secondary: var(--color-ink-light);
    --color-text-muted: var(--color-ink-lighter);
    --color-border: var(--color-rule);
    --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  }

  [data-theme="dark"] {
    --color-bg: #0f0e0d;
    --color-ink: #e8e4df;
    --color-ink-light: #b8b4ae;
    --color-ink-lighter: #7a766f;
    --color-accent: #d4b078;
    --color-accent-light: #e0c090;
    --color-rule: #2a2826;
    --color-text: var(--color-ink);
    --color-text-secondary: var(--color-ink-light);
    --color-text-muted: var(--color-ink-lighter);
    --color-border: var(--color-rule);
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    scroll-behavior: smooth;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    font-family: var(--font-sans);
    background: var(--color-bg);
    color: var(--color-text);
    min-height: 100vh;
    line-height: 1.6;
  }

  ::selection {
    background: var(--color-accent);
    color: white;
  }

  a {
    color: var(--color-ink);
    text-decoration: none;
    transition: color 0.2s ease;
  }

  a:hover {
    color: var(--color-accent);
  }

  .container {
    max-width: 720px;
    margin: 0 auto;
    padding: 2rem;
    position: relative;
    z-index: 1;
  }

  /* Typography for blog content */
  .prose {
    color: var(--color-text-secondary);
    font-size: 1.1rem;
    line-height: 1.8;
  }

  .prose h1, .prose h2, .prose h3, .prose h4 {
    color: var(--color-text);
    font-family: var(--font-display);
    font-weight: 400;
    margin: 2rem 0 1rem;
    line-height: 1.3;
  }

  .prose h1 { font-size: 2rem; }
  .prose h2 { font-size: 1.5rem; }
  .prose h3 { font-size: 1.2rem; }

  .prose p {
    margin-bottom: 1.5rem;
  }

  .prose a {
    color: var(--color-accent);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .prose a:hover {
    color: var(--color-ink);
  }

  .prose code {
    font-family: var(--font-mono);
    background: rgba(0, 0, 0, 0.05);
    padding: 0.2em 0.4em;
    border-radius: 4px;
    font-size: 0.9em;
  }

  .prose pre {
    background: var(--color-ink);
    color: #f8f5f0;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 1.5rem;
    overflow-x: auto;
    margin: 1.5rem 0;
  }

  .prose pre code {
    background: none;
    padding: 0;
    font-size: 0.9rem;
    line-height: 1.6;
    color: inherit;
  }

  .prose blockquote {
    border-left: 3px solid var(--color-accent);
    padding-left: 1.5rem;
    margin: 1.5rem 0;
    font-style: italic;
    font-family: var(--font-serif);
    color: var(--color-text-muted);
  }

  .prose ul, .prose ol {
    margin: 1.5rem 0;
    padding-left: 1.5rem;
  }

  .prose li {
    margin-bottom: 0.5rem;
  }

  .prose img {
    max-width: 100%;
    border-radius: 8px;
    margin: 1.5rem 0;
  }

  .prose hr {
    border: none;
    border-top: 1px solid var(--color-border);
    margin: 2rem 0;
  }

  /* Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-family: var(--font-sans);
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s var(--ease-out-expo);
    border: none;
    text-decoration: none;
  }

  .btn-primary {
    background: var(--color-accent);
    color: white;
  }

  .btn-primary:hover {
    background: var(--color-ink);
    color: var(--color-bg);
  }

  .btn-ghost {
    background: transparent;
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border);
  }

  .btn-ghost:hover {
    background: rgba(0, 0, 0, 0.03);
    color: var(--color-text);
    border-color: var(--color-ink-lighter);
  }

  .btn-danger {
    background: transparent;
    color: #c44;
    border: 1px solid rgba(204, 68, 68, 0.3);
  }

  .btn-danger:hover {
    background: rgba(204, 68, 68, 0.1);
    border-color: #c44;
  }

  /* Form elements */
  input, textarea {
    width: 100%;
    padding: 0.75rem 1rem;
    background: white;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    color: var(--color-text);
    font-family: var(--font-sans);
    font-size: 1rem;
    transition: border-color 0.2s ease;
  }

  input:focus, textarea:focus {
    outline: none;
    border-color: var(--color-accent);
  }

  textarea {
    font-family: var(--font-mono);
    resize: vertical;
    min-height: 300px;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: var(--color-text-secondary);
    font-size: 0.9rem;
  }

  /* Theme Toggle */
  .theme-toggle {
    position: fixed;
    top: 2rem;
    right: 2rem;
    z-index: 100;
    width: 40px;
    height: 40px;
    border: 1px solid var(--color-border);
    border-radius: 50%;
    background: var(--color-bg);
    color: var(--color-text);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s var(--ease-out-expo);
  }

  .theme-toggle:hover {
    border-color: var(--color-accent);
    color: var(--color-accent);
    transform: scale(1.05);
  }

  .theme-toggle:active {
    transform: scale(0.95);
  }

  .theme-toggle.animating {
    pointer-events: none;
  }

  .theme-toggle svg {
    width: 18px;
    height: 18px;
  }

  /* Theme Splash Animation */
  .theme-splash {
    position: fixed;
    inset: 0;
    z-index: 99;
    pointer-events: none;
    clip-path: circle(0% at var(--splash-x) var(--splash-y));
    animation: splashReveal 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  .theme-splash-dark {
    background: #0f0e0d;
  }

  .theme-splash-light {
    background: #f8f5f0;
  }

  @keyframes splashReveal {
    0% {
      clip-path: circle(0% at var(--splash-x) var(--splash-y));
    }
    100% {
      clip-path: circle(150% at var(--splash-x) var(--splash-y));
    }
  }

  /* Animations */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .animate-in {
    animation: fadeIn 0.6s var(--ease-out-expo) forwards;
  }

  .delay-1 { animation-delay: 0.1s; opacity: 0; }
  .delay-2 { animation-delay: 0.2s; opacity: 0; }
  .delay-3 { animation-delay: 0.3s; opacity: 0; }

  @media (prefers-reduced-motion: reduce) {
    .theme-splash {
      animation: none;
      clip-path: circle(150% at var(--splash-x) var(--splash-y));
    }
  }
`;

export const themeScript = `
  <script>
    (function() {
      const stored = localStorage.getItem('theme');
      const theme = stored || 'dark';
      document.documentElement.setAttribute('data-theme', theme);
    })();
  </script>
`;

export const themeToggleHTML = `
  <button class="theme-toggle" id="theme-toggle" aria-label="Toggle theme">
    <svg class="sun-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: none;">
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
    <svg class="moon-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  </button>
  <div id="theme-splash"></div>
  <script>
    (function() {
      const toggle = document.getElementById('theme-toggle');
      const splash = document.getElementById('theme-splash');
      const sunIcon = toggle.querySelector('.sun-icon');
      const moonIcon = toggle.querySelector('.moon-icon');
      let isAnimating = false;

      function updateIcons() {
        const theme = document.documentElement.getAttribute('data-theme');
        if (theme === 'dark') {
          sunIcon.style.display = 'block';
          moonIcon.style.display = 'none';
        } else {
          sunIcon.style.display = 'none';
          moonIcon.style.display = 'block';
        }
      }

      updateIcons();

      toggle.addEventListener('click', function(e) {
        if (isAnimating) return;
        isAnimating = true;
        toggle.classList.add('animating');

        const rect = toggle.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        splash.className = 'theme-splash theme-splash-' + newTheme;
        splash.style.setProperty('--splash-x', x + 'px');
        splash.style.setProperty('--splash-y', y + 'px');

        setTimeout(function() {
          document.documentElement.setAttribute('data-theme', newTheme);
          localStorage.setItem('theme', newTheme);
          updateIcons();

          setTimeout(function() {
            splash.className = '';
            isAnimating = false;
            toggle.classList.remove('animating');
          }, 50);
        }, 600);
      });
    })();
  </script>
`;

export const baseHead = `
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>K</text></svg>">
  ${themeScript}
  <style>${baseStyles}</style>
`;

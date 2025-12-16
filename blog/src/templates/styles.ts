// Shared styles matching kcodes.me theme
export const baseStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Crimson+Pro:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap');

  :root {
    --font-display: 'Space Grotesk', system-ui, sans-serif;
    --font-serif: 'Crimson Pro', Georgia, serif;
    --font-mono: 'JetBrains Mono', monospace;
    --color-bg: #030303;
    --color-accent: #764ba2;
    --color-accent-light: #f093fb;
    --color-text: #fafafa;
    --color-text-secondary: rgba(250, 250, 250, 0.6);
    --color-text-muted: rgba(250, 250, 250, 0.3);
    --color-border: rgba(255, 255, 255, 0.08);
    --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
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
    font-family: var(--font-display);
    background: var(--color-bg);
    color: var(--color-text);
    min-height: 100vh;
    line-height: 1.6;
  }

  /* Mesh background */
  body::before {
    content: "";
    position: fixed;
    inset: 0;
    z-index: -1;
    background:
      radial-gradient(ellipse 80% 50% at 20% 40%, rgba(120, 0, 255, 0.15) 0%, transparent 50%),
      radial-gradient(ellipse 60% 80% at 80% 20%, rgba(255, 0, 128, 0.1) 0%, transparent 50%),
      radial-gradient(ellipse 50% 60% at 60% 80%, rgba(0, 150, 255, 0.08) 0%, transparent 50%),
      linear-gradient(180deg, #030303 0%, #0a0512 50%, #030303 100%);
  }

  /* Noise overlay */
  body::after {
    content: "";
    position: fixed;
    inset: 0;
    z-index: 9999;
    pointer-events: none;
    opacity: 0.03;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  }

  ::selection {
    background: var(--color-accent);
    color: white;
  }

  a {
    color: var(--color-accent-light);
    text-decoration: none;
    transition: color 0.2s ease;
  }

  a:hover {
    color: var(--color-text);
  }

  .container {
    max-width: 720px;
    margin: 0 auto;
    padding: 2rem;
    position: relative;
    z-index: 1;
  }

  .glass {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(20px);
    border: 1px solid var(--color-border);
    border-radius: 12px;
  }

  /* Typography for blog content */
  .prose {
    color: var(--color-text-secondary);
    font-size: 1.1rem;
    line-height: 1.8;
  }

  .prose h1, .prose h2, .prose h3, .prose h4 {
    color: var(--color-text);
    font-weight: 500;
    margin: 2rem 0 1rem;
    line-height: 1.3;
  }

  .prose h1 { font-size: 2.5rem; }
  .prose h2 { font-size: 1.8rem; }
  .prose h3 { font-size: 1.4rem; }

  .prose p {
    margin-bottom: 1.5rem;
  }

  .prose a {
    color: var(--color-accent-light);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .prose code {
    font-family: var(--font-mono);
    background: rgba(255, 255, 255, 0.1);
    padding: 0.2em 0.4em;
    border-radius: 4px;
    font-size: 0.9em;
  }

  .prose pre {
    background: rgba(0, 0, 0, 0.5);
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
  }

  .prose blockquote {
    border-left: 3px solid var(--color-accent);
    padding-left: 1.5rem;
    margin: 1.5rem 0;
    font-style: italic;
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
    font-family: var(--font-display);
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
    background: var(--color-accent-light);
    color: #030303;
  }

  .btn-ghost {
    background: transparent;
    color: var(--color-text-secondary);
    border: 1px solid var(--color-border);
  }

  .btn-ghost:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--color-text);
    border-color: rgba(255, 255, 255, 0.15);
  }

  .btn-danger {
    background: transparent;
    color: #f5576c;
    border: 1px solid rgba(245, 87, 108, 0.3);
  }

  .btn-danger:hover {
    background: rgba(245, 87, 108, 0.1);
    border-color: #f5576c;
  }

  /* Form elements */
  input, textarea {
    width: 100%;
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    color: var(--color-text);
    font-family: var(--font-display);
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
`;

export const baseHead = `
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>✍️</text></svg>">
  <style>${baseStyles}</style>
`;

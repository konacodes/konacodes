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
    --color-rule: #d4d0c8;
    --color-text: var(--color-ink);
    --color-text-secondary: var(--color-ink-light);
    --color-text-muted: var(--color-ink-lighter);
    --color-border: var(--color-rule);
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
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>K</text></svg>">
  <style>${baseStyles}</style>
`;

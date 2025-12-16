import { baseHead } from './styles';

interface Post {
  id: string;
  title: string;
  slug: string;
  content?: string;
  excerpt: string | null;
  published?: number;
  created_at: string;
  updated_at?: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function renderHome(posts: Post[]): string {
  const postsList = posts.length > 0
    ? posts.map((post, i) => `
        <article class="post-card animate-in delay-${Math.min(i + 1, 3)}" style="animation-delay: ${0.1 + i * 0.1}s">
          <a href="/p/${post.slug}">
            <time>${formatDate(post.created_at)}</time>
            <h2>${post.title}</h2>
            ${post.excerpt ? `<p>${post.excerpt}</p>` : ''}
          </a>
        </article>
      `).join('')
    : `
        <div class="empty-state animate-in delay-1">
          <p>nothing here yet</p>
          <span>check back soon</span>
        </div>
      `;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      ${baseHead}
      <title>blog — kona_</title>
      <meta name="description" content="thoughts and things by kona">
      <style>
        .header {
          padding: 4rem 0 3rem;
          border-bottom: 1px solid var(--color-border);
          margin-bottom: 3rem;
        }

        .header h1 {
          font-size: 2.5rem;
          font-weight: 300;
          margin-bottom: 0.5rem;
        }

        .header h1 span {
          font-family: var(--font-mono);
          color: var(--color-accent-light);
        }

        .header p {
          color: var(--color-text-muted);
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--color-text-muted);
          font-size: 0.9rem;
          margin-bottom: 2rem;
          transition: color 0.2s ease;
        }

        .back-link:hover {
          color: var(--color-text);
        }

        .posts {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .post-card {
          margin: 0 -2rem;
          padding: 0;
        }

        .post-card a {
          display: block;
          padding: 2rem;
          transition: background 0.2s ease;
        }

        .post-card a:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .post-card time {
          font-family: var(--font-mono);
          font-size: 0.8rem;
          color: var(--color-text-muted);
          display: block;
          margin-bottom: 0.5rem;
        }

        .post-card h2 {
          font-size: 1.4rem;
          font-weight: 400;
          color: var(--color-text);
          margin-bottom: 0.5rem;
          transition: color 0.2s ease;
        }

        .post-card a:hover h2 {
          color: var(--color-accent-light);
        }

        .post-card p {
          color: var(--color-text-secondary);
          font-size: 0.95rem;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
        }

        .empty-state p {
          font-size: 1.5rem;
          color: var(--color-text-secondary);
          margin-bottom: 0.5rem;
        }

        .empty-state span {
          color: var(--color-text-muted);
          font-size: 0.9rem;
        }

        .footer {
          margin-top: 4rem;
          padding-top: 2rem;
          border-top: 1px solid var(--color-border);
          text-align: center;
        }

        .footer p {
          color: var(--color-text-muted);
          font-size: 0.85rem;
        }

        .footer a {
          color: var(--color-accent-light);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <a href="https://kcodes.me" class="back-link animate-in">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          kcodes.me
        </a>

        <header class="header animate-in delay-1">
          <h1><span>kona_</span>/blog</h1>
          <p>thoughts, projects, and random things</p>
        </header>

        <main class="posts">
          ${postsList}
        </main>

        <footer class="footer animate-in delay-3">
          <p>
            <a href="https://kcodes.me">kcodes.me</a>
          </p>
        </footer>
      </div>
    </body>
    </html>
  `;
}

export function renderPost(post: Post, htmlContent: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      ${baseHead}
      <title>${post.title} — kona_</title>
      <meta name="description" content="${post.excerpt || post.title}">
      <style>
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--color-text-muted);
          font-size: 0.9rem;
          margin-bottom: 3rem;
          transition: color 0.2s ease;
        }

        .back-link:hover {
          color: var(--color-text);
        }

        .post-header {
          margin-bottom: 3rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid var(--color-border);
        }

        .post-header time {
          font-family: var(--font-mono);
          font-size: 0.85rem;
          color: var(--color-text-muted);
          display: block;
          margin-bottom: 1rem;
        }

        .post-header h1 {
          font-size: 2.5rem;
          font-weight: 400;
          line-height: 1.2;
          margin-bottom: 1rem;
        }

        .post-header .excerpt {
          font-size: 1.2rem;
          color: var(--color-text-secondary);
          font-family: var(--font-serif);
          font-style: italic;
        }

        .post-content {
          padding-bottom: 4rem;
        }

        .footer {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid var(--color-border);
        }

        .footer a {
          color: var(--color-accent-light);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <a href="/" class="back-link animate-in">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          back to blog
        </a>

        <article>
          <header class="post-header animate-in delay-1">
            <time>${formatDate(post.created_at)}</time>
            <h1>${post.title}</h1>
            ${post.excerpt ? `<p class="excerpt">${post.excerpt}</p>` : ''}
          </header>

          <div class="post-content prose animate-in delay-2">
            ${htmlContent}
          </div>
        </article>

        <footer class="footer animate-in delay-3">
          <a href="/">← more posts</a>
        </footer>
      </div>
    </body>
    </html>
  `;
}

export function render404(): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      ${baseHead}
      <title>not found — kona_</title>
      <style>
        .container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          text-align: center;
        }

        h1 {
          font-size: 6rem;
          font-weight: 300;
          color: var(--color-accent);
          margin-bottom: 1rem;
        }

        p {
          color: var(--color-text-secondary);
          margin-bottom: 2rem;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 class="animate-in">404</h1>
        <p class="animate-in delay-1">couldn't find that one</p>
        <a href="/" class="btn btn-ghost animate-in delay-2">back to blog</a>
      </div>
    </body>
    </html>
  `;
}

export function renderNotFound(): string {
  return render404();
}

import { baseHead } from './styles';

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  published: number;
  created_at: string;
  updated_at: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

const adminStyles = `
  .admin-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 2rem 0;
    border-bottom: 1px solid var(--color-border);
    margin-bottom: 2rem;
  }

  .admin-header h1 {
    font-size: 1.5rem;
    font-weight: 400;
  }

  .admin-header h1 span {
    color: var(--color-accent-light);
    font-family: var(--font-mono);
  }

  .posts-list {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .post-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem;
    margin: 0 -1.25rem;
    border-radius: 8px;
    transition: background 0.2s ease;
  }

  .post-item:hover {
    background: rgba(255, 255, 255, 0.02);
  }

  .post-info {
    flex: 1;
    min-width: 0;
  }

  .post-info h3 {
    font-size: 1.1rem;
    font-weight: 400;
    margin-bottom: 0.25rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .post-info h3 a {
    color: var(--color-text);
  }

  .post-info h3 a:hover {
    color: var(--color-accent-light);
  }

  .post-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.8rem;
    color: var(--color-text-muted);
    font-family: var(--font-mono);
  }

  .post-meta .status {
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .post-meta .status.published {
    background: rgba(74, 222, 128, 0.1);
    color: #4ade80;
  }

  .post-meta .status.draft {
    background: rgba(250, 204, 21, 0.1);
    color: #facc15;
  }

  .post-actions {
    display: flex;
    gap: 0.5rem;
  }

  .post-actions a, .post-actions button {
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
  }

  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: var(--color-text-muted);
  }

  .empty-state p {
    margin-bottom: 1.5rem;
  }

  /* Editor styles */
  .editor-container {
    padding: 2rem 0;
  }

  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .editor-header h1 {
    font-size: 1.5rem;
    font-weight: 400;
  }

  .editor-actions {
    display: flex;
    gap: 0.75rem;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .form-group.full {
    grid-column: 1 / -1;
  }

  .checkbox-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .checkbox-group input[type="checkbox"] {
    width: auto;
    accent-color: var(--color-accent);
  }

  .checkbox-group label {
    margin: 0;
    color: var(--color-text);
    cursor: pointer;
  }

  .editor-main {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-top: 1.5rem;
  }

  .editor-pane h3 {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--color-text-muted);
    margin-bottom: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .editor-pane textarea {
    min-height: 500px;
  }

  .preview-pane {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 1.5rem;
    min-height: 500px;
    overflow-y: auto;
  }

  .preview-pane.empty {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-muted);
    font-style: italic;
  }

  @media (max-width: 768px) {
    .editor-main {
      grid-template-columns: 1fr;
    }

    .form-row {
      grid-template-columns: 1fr;
    }

    .preview-pane {
      min-height: 300px;
    }
  }
`;

export function renderAdmin(posts: Post[]): string {
  const postsList = posts.length > 0
    ? posts.map((post, i) => `
        <div class="post-item animate-in" style="animation-delay: ${0.1 + i * 0.05}s">
          <div class="post-info">
            <h3><a href="/e/${post.id}">${post.title}</a></h3>
            <div class="post-meta">
              <span>/p/${post.slug}</span>
              <span>${formatDate(post.created_at)}</span>
              <span class="status ${post.published ? 'published' : 'draft'}">${post.published ? 'live' : 'draft'}</span>
            </div>
          </div>
          <div class="post-actions">
            <a href="/e/${post.id}" class="btn btn-ghost">edit</a>
            ${post.published ? `<a href="/p/${post.slug}" class="btn btn-ghost" target="_blank">view</a>` : ''}
          </div>
        </div>
      `).join('')
    : `
        <div class="empty-state">
          <p>no posts yet</p>
          <a href="/admin/new" class="btn btn-primary">write your first post</a>
        </div>
      `;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      ${baseHead}
      <title>admin — kona_/blog</title>
      <style>${adminStyles}</style>
    </head>
    <body>
      <div class="container">
        <header class="admin-header animate-in">
          <h1><span>kona_</span>/admin</h1>
          <a href="/admin/new" class="btn btn-primary">new post</a>
        </header>

        <main class="posts-list">
          ${postsList}
        </main>
      </div>
    </body>
    </html>
  `;
}

export function renderNewPost(): string {
  return renderEditorPage({
    id: '',
    title: '',
    slug: '',
    content: '',
    excerpt: null,
    published: 0,
    created_at: '',
    updated_at: ''
  }, true);
}

export function renderEditor(post: Post): string {
  return renderEditorPage(post, false);
}

function renderEditorPage(post: Post, isNew: boolean): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      ${baseHead}
      <title>${isNew ? 'new post' : `edit: ${post.title}`} — kona_/blog</title>
      <style>${adminStyles}</style>
    </head>
    <body>
      <div class="container">
        <div class="editor-container">
          <header class="editor-header animate-in">
            <h1>${isNew ? 'new post' : 'edit post'}</h1>
            <div class="editor-actions">
              <a href="/admin" class="btn btn-ghost">cancel</a>
              ${!isNew ? `<button type="button" class="btn btn-danger" onclick="deletePost()">delete</button>` : ''}
              <button type="button" class="btn btn-primary" onclick="savePost()">
                ${isNew ? 'publish' : 'save'}
              </button>
            </div>
          </header>

          <form id="post-form" class="animate-in delay-1">
            <div class="form-row">
              <div class="form-group">
                <label for="title">title</label>
                <input type="text" id="title" name="title" value="${escapeHtml(post.title)}" placeholder="post title" required>
              </div>
              <div class="form-group">
                <label for="slug">slug</label>
                <input type="text" id="slug" name="slug" value="${escapeHtml(post.slug)}" placeholder="url-friendly-slug" required>
              </div>
            </div>

            <div class="form-group">
              <label for="excerpt">excerpt <span style="color: var(--color-text-muted); font-weight: 400;">(optional)</span></label>
              <input type="text" id="excerpt" name="excerpt" value="${escapeHtml(post.excerpt || '')}" placeholder="brief description for previews">
            </div>

            <div class="form-group">
              <div class="checkbox-group">
                <input type="checkbox" id="published" name="published" ${post.published ? 'checked' : ''}>
                <label for="published">publish (make visible to everyone)</label>
              </div>
            </div>

            <div class="editor-main">
              <div class="editor-pane">
                <h3>markdown</h3>
                <textarea id="content" name="content" placeholder="write your post in markdown...">${escapeHtml(post.content)}</textarea>
              </div>
              <div class="editor-pane">
                <h3>preview</h3>
                <div id="preview" class="preview-pane prose ${post.content ? '' : 'empty'}">
                  ${post.content ? '' : 'preview will appear here...'}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      <script>
        const isNew = ${isNew};
        const postId = '${post.id}';
        let previewTimeout;

        // Auto-generate slug from title
        document.getElementById('title').addEventListener('input', (e) => {
          if (isNew || !document.getElementById('slug').value) {
            const slug = e.target.value
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '');
            document.getElementById('slug').value = slug;
          }
        });

        // Live preview with debounce
        document.getElementById('content').addEventListener('input', (e) => {
          clearTimeout(previewTimeout);
          previewTimeout = setTimeout(() => updatePreview(e.target.value), 300);
        });

        async function updatePreview(content) {
          const preview = document.getElementById('preview');
          if (!content.trim()) {
            preview.innerHTML = 'preview will appear here...';
            preview.classList.add('empty');
            return;
          }

          try {
            const res = await fetch('/api/preview', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content })
            });
            const data = await res.json();
            preview.innerHTML = data.html;
            preview.classList.remove('empty');
          } catch (err) {
            console.error('Preview error:', err);
          }
        }

        async function savePost() {
          const form = document.getElementById('post-form');
          const data = {
            title: document.getElementById('title').value,
            slug: document.getElementById('slug').value,
            content: document.getElementById('content').value,
            excerpt: document.getElementById('excerpt').value || null,
            published: document.getElementById('published').checked
          };

          if (!data.title || !data.slug || !data.content) {
            alert('title, slug, and content are required');
            return;
          }

          try {
            const url = isNew ? '/api/posts' : '/api/posts/' + postId;
            const method = isNew ? 'POST' : 'PUT';

            const res = await fetch(url, {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });

            const result = await res.json();
            if (result.success) {
              window.location.href = '/admin';
            } else {
              alert('error: ' + (result.error || 'unknown error'));
            }
          } catch (err) {
            alert('error saving post: ' + err.message);
          }
        }

        async function deletePost() {
          if (!confirm('are you sure you want to delete this post?')) return;

          try {
            const res = await fetch('/api/posts/' + postId, { method: 'DELETE' });
            const result = await res.json();
            if (result.success) {
              window.location.href = '/admin';
            } else {
              alert('error: ' + (result.error || 'unknown error'));
            }
          } catch (err) {
            alert('error deleting post: ' + err.message);
          }
        }

        // Initial preview if content exists
        const initialContent = document.getElementById('content').value;
        if (initialContent) {
          updatePreview(initialContent);
        }
      </script>
    </body>
    </html>
  `;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

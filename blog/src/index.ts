import { renderHome, renderPost, renderNotFound, render404 } from './templates/public';
import { renderAdmin, renderEditor, renderNewPost } from './templates/admin';
import { marked } from 'marked';
import { transformDiagramBlock } from './templates/diagrams';

export interface Env {
  DB: D1Database;
}

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

// Generate a short unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

// Configure marked with custom renderer for diagram support
marked.use({
  renderer: {
    code(code: string, infostring: string | undefined, _escaped: boolean): string | false {
      if (infostring) {
        const diagramHtml = transformDiagramBlock(infostring, code);
        if (diagramHtml) {
          return diagramHtml;
        }
      }
      // Return false to fall back to default renderer
      return false;
    }
  }
});

// Parse markdown to HTML with diagram support
async function parseMarkdown(content: string): Promise<string> {
  return await marked(content);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // ============================================
    // PUBLIC ROUTES
    // ============================================

    // Home - list all published posts
    if (path === '/' || path === '') {
      const posts = await env.DB.prepare(
        'SELECT id, title, slug, excerpt, created_at FROM posts WHERE published = 1 ORDER BY created_at DESC'
      ).all<Post>();

      return new Response(renderHome(posts.results || []), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // View post - /p/:slug
    if (path.startsWith('/p/')) {
      const slug = path.slice(3);
      const post = await env.DB.prepare(
        'SELECT * FROM posts WHERE slug = ? AND published = 1'
      ).bind(slug).first<Post>();

      if (!post) {
        return new Response(render404(), {
          status: 404,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }

      const htmlContent = await parseMarkdown(post.content);
      return new Response(renderPost(post, htmlContent), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // ============================================
    // ADMIN ROUTES (protected by Cloudflare Access)
    // ============================================

    // Admin dashboard
    if (path === '/admin' || path === '/admin/') {
      const posts = await env.DB.prepare(
        'SELECT id, title, slug, published, created_at, updated_at FROM posts ORDER BY created_at DESC'
      ).all<Post>();

      return new Response(renderAdmin(posts.results || []), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // New post page
    if (path === '/admin/new') {
      return new Response(renderNewPost(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // Edit post - /e/:id
    if (path.startsWith('/e/')) {
      const id = path.slice(3);
      const post = await env.DB.prepare(
        'SELECT * FROM posts WHERE id = ?'
      ).bind(id).first<Post>();

      if (!post) {
        return new Response(render404(), {
          status: 404,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }

      return new Response(renderEditor(post), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // ============================================
    // API ROUTES
    // ============================================

    // Create post
    if (path === '/api/posts' && request.method === 'POST') {
      try {
        const body = await request.json() as { title: string; slug: string; content: string; excerpt?: string; published?: boolean };
        const id = generateId();
        const { title, slug, content, excerpt, published } = body;

        await env.DB.prepare(
          'INSERT INTO posts (id, title, slug, content, excerpt, published) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(id, title, slug, content, excerpt || null, published ? 1 : 0).run();

        return Response.json({ success: true, id, slug });
      } catch (error) {
        return Response.json({ success: false, error: String(error) }, { status: 400 });
      }
    }

    // Update post
    if (path.startsWith('/api/posts/') && request.method === 'PUT') {
      try {
        const id = path.slice(11);
        const body = await request.json() as { title: string; slug: string; content: string; excerpt?: string; published?: boolean };
        const { title, slug, content, excerpt, published } = body;

        await env.DB.prepare(
          `UPDATE posts SET title = ?, slug = ?, content = ?, excerpt = ?, published = ?, updated_at = datetime('now') WHERE id = ?`
        ).bind(title, slug, content, excerpt || null, published ? 1 : 0, id).run();

        return Response.json({ success: true });
      } catch (error) {
        return Response.json({ success: false, error: String(error) }, { status: 400 });
      }
    }

    // Delete post
    if (path.startsWith('/api/posts/') && request.method === 'DELETE') {
      try {
        const id = path.slice(11);
        await env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(id).run();
        return Response.json({ success: true });
      } catch (error) {
        return Response.json({ success: false, error: String(error) }, { status: 400 });
      }
    }

    // Preview markdown (for live preview in editor)
    if (path === '/api/preview' && request.method === 'POST') {
      try {
        const body = await request.json() as { content: string };
        const html = await parseMarkdown(body.content);
        return Response.json({ html });
      } catch (error) {
        return Response.json({ success: false, error: String(error) }, { status: 400 });
      }
    }

    // 404 for everything else
    return new Response(render404(), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  },
};

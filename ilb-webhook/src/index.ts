/**
 * Ilb Webhook Worker
 *
 * Handles privacy policy link click events for the Ilb Discord bot.
 * Stores click events in KV storage that the bot can check.
 */

interface Env {
  CLICKS: KVNamespace;
  WEBHOOK_SECRET: string;
}

// CORS headers for cross-origin requests from the privacy page
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check
    if (url.pathname === '/health') {
      return Response.json({ status: 'ok' }, { headers: corsHeaders });
    }

    // POST /click - Record a link click
    if (request.method === 'POST' && url.pathname === '/click') {
      try {
        const body = await request.json() as { user_id?: string; token?: string };
        const { user_id, token } = body;

        if (!user_id) {
          return Response.json(
            { error: 'Missing user_id' },
            { status: 400, headers: corsHeaders }
          );
        }

        // Optional: Validate token against secret
        if (env.WEBHOOK_SECRET && token !== env.WEBHOOK_SECRET) {
          // For now, we'll be lenient and just log
          console.log(`Token mismatch for user ${user_id}`);
        }

        // Store the click with 24-hour TTL
        await env.CLICKS.put(`click:${user_id}`, JSON.stringify({
          clicked_at: new Date().toISOString(),
          token: token || null,
        }), {
          expirationTtl: 86400, // 24 hours
        });

        return Response.json(
          { success: true, user_id },
          { headers: corsHeaders }
        );
      } catch (e) {
        return Response.json(
          { error: 'Invalid request body' },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // GET /check/:user_id - Check if user clicked the link
    if (request.method === 'GET' && url.pathname.startsWith('/check/')) {
      const userId = url.pathname.replace('/check/', '');

      if (!userId) {
        return Response.json(
          { error: 'Missing user_id' },
          { status: 400, headers: corsHeaders }
        );
      }

      const click = await env.CLICKS.get(`click:${userId}`);

      if (click) {
        const data = JSON.parse(click);
        return Response.json(
          { clicked: true, ...data },
          { headers: corsHeaders }
        );
      }

      return Response.json(
        { clicked: false },
        { headers: corsHeaders }
      );
    }

    // DELETE /click/:user_id - Clear click status (after opt-in)
    if (request.method === 'DELETE' && url.pathname.startsWith('/click/')) {
      const userId = url.pathname.replace('/click/', '');

      if (!userId) {
        return Response.json(
          { error: 'Missing user_id' },
          { status: 400, headers: corsHeaders }
        );
      }

      await env.CLICKS.delete(`click:${userId}`);

      return Response.json(
        { success: true, user_id: userId },
        { headers: corsHeaders }
      );
    }

    return Response.json(
      { error: 'Not found' },
      { status: 404, headers: corsHeaders }
    );
  },
};

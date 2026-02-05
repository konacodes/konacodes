import { file } from "bun";

const dir = import.meta.dir;

Bun.serve({
  port: 4000,
  routes: {
    "/": new Response(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Kona Prototypes</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Rock+Salt&family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Space+Grotesk:wght@300;400;500&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Space Grotesk', sans-serif; background: #0f0e0d; color: #e8e4df; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
  .wrap { text-align: center; max-width: 600px; padding: 2rem; }
  h1 { font-family: 'Rock Salt', cursive; font-size: 2.5rem; margin-bottom: 0.5rem; font-weight: 400; }
  p { color: #7a766f; margin-bottom: 3rem; font-size: 0.9rem; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  a { display: block; padding: 1.5rem 2rem; background: rgba(255,255,255,0.03); border: 1px solid #2a2826; border-radius: 12px; color: #e8e4df; text-decoration: none; transition: all 0.3s ease; }
  a:hover { background: rgba(212,176,120,0.08); border-color: #c9a66b; transform: translateY(-2px); }
  .fav { border-color: rgba(201,166,107,0.3); background: rgba(212,176,120,0.04); }
  .num { font-family: 'Playfair Display', serif; font-size: 1.4rem; color: #c9a66b; }
  .label { font-size: 0.85rem; color: #7a766f; margin-top: 0.25rem; }
  .badge { font-size: 0.55rem; color: #c9a66b; letter-spacing: 0.15em; text-transform: uppercase; margin-top: 0.5rem; }
  .divider { grid-column: span 2; text-align: center; font-size: 0.65rem; color: #3a3836; letter-spacing: 0.2em; text-transform: uppercase; padding: 0.5rem 0; }
</style></head><body>
<div class="wrap">
  <h1>Prototypes</h1>
  <p>8 layout explorations for kcodes.me</p>
  <div class="grid">
    <a href="/1" class="fav"><span class="num">01</span><div class="label">Vertical Chapters</div><div class="badge">Favorite</div></a>
    <a href="/2" class="fav"><span class="num">02</span><div class="label">Split Folio</div><div class="badge">Favorite</div></a>
    <a href="/3" class="fav"><span class="num">03</span><div class="label">Warm Collage</div><div class="badge">Favorite</div></a>
    <div class="divider">All-Out Explorations</div>
    <a href="/4"><span class="num">04</span><div class="label">Noir Typographic</div></a>
    <a href="/5"><span class="num">05</span><div class="label">The Archive</div></a>
    <a href="/6"><span class="num">06</span><div class="label">Warm Layers</div></a>
    <a href="/7"><span class="num">07</span><div class="label">Cinematic</div></a>
    <a href="/8"><span class="num">08</span><div class="label">The Handcraft</div></a>
  </div>
</div>
</body></html>`, { headers: { "Content-Type": "text/html" } }),

    "/1": async (req) => new Response(file(`${dir}/1.html`)),
    "/2": async (req) => new Response(file(`${dir}/2.html`)),
    "/3": async (req) => new Response(file(`${dir}/3.html`)),
    "/4": async (req) => new Response(file(`${dir}/4.html`)),
    "/5": async (req) => new Response(file(`${dir}/5.html`)),
    "/6": async (req) => new Response(file(`${dir}/6.html`)),
    "/7": async (req) => new Response(file(`${dir}/7.html`)),
    "/8": async (req) => new Response(file(`${dir}/8.html`)),
  },
});

console.log("Prototypes running at http://localhost:4000");

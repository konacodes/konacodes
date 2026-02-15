import { serve } from "bun";
import index from "./index.html";

const server = serve({
  static: {
    "/images/light-bg-hero-section.png": new Response(Bun.file("public/images/light-bg-hero-section.png")),
    "/images/light-bg-no-text.png": new Response(Bun.file("public/images/light-bg-no-text.png")),
  },
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,

    "/api/hello": {
      async GET(req) {
        return Response.json({
          message: "Hello, world!",
          method: "GET",
        });
      },
      async PUT(req) {
        return Response.json({
          message: "Hello, world!",
          method: "PUT",
        });
      },
    },

    "/api/hello/:name": async req => {
      const name = req.params.name;
      return Response.json({
        message: `Hello, ${name}!`,
      });
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);

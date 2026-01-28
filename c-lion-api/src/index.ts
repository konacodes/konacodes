import { getRandomFact, SEA_LION_FACTS } from "./facts";

const SEA_LION_IMAGES = [
  "https://upload.wikimedia.org/wikipedia/commons/f/f5/Sea_lion_family.JPG",
  "https://upload.wikimedia.org/wikipedia/commons/4/4c/Sealion052006.JPG",
  "https://upload.wikimedia.org/wikipedia/commons/7/75/Sea_Lions_Pier_39_San_Fran.JPG",
  "https://upload.wikimedia.org/wikipedia/commons/d/df/Californian_Sea_Lion_Auckland_Zoo.JPG",
  "https://upload.wikimedia.org/wikipedia/commons/3/3c/California_sea_lion_%2854294112460%29.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/e/e1/California_Sea_Lion_VA_01.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/c/c5/California_Sea_Lion_VA_03.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/9/90/California_Sea_Lion%2C_Monterey%2C_CA%2C_USA_imported_from_iNaturalist_photo_100213401.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/3/33/California_Sea_Lion%2C_Pillar_Point_Harbor%2C_CA%2C_US_imported_from_iNaturalist_photo_171254002_%28cropped%29.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/1/1e/California_Sea_Lion%2C_San_Pedro%2C_Los_Angeles%2C_CA%2C_USA_imported_from_iNaturalist_photo_177215839.jpg",
];

function getRandomImage(): string {
  return SEA_LION_IMAGES[Math.floor(Math.random() * SEA_LION_IMAGES.length)];
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + " " + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function generateMeme(): Promise<Response> {
  const fact = getRandomFact();
  const imageUrl = getRandomImage();

  const lines = wrapText(fact, 40);
  const lineHeight = 36;
  const totalTextHeight = lines.length * lineHeight;
  const startY = 480 - totalTextHeight - 20;

  const textElements = lines
    .map((line, i) => {
      const y = startY + i * lineHeight;
      return `
        <text x="400" y="${y}" text-anchor="middle" font-family="Impact, Arial Black, sans-serif" font-size="28" fill="white" stroke="black" stroke-width="2">${escapeXml(line)}</text>
      `;
    })
    .join("");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="800" height="500" viewBox="0 0 800 500">
  <defs>
    <clipPath id="rounded">
      <rect width="800" height="500" rx="12" ry="12"/>
    </clipPath>
  </defs>
  <rect width="800" height="500" fill="#1a1a2e" rx="12" ry="12"/>
  <image href="${imageUrl}" x="0" y="0" width="800" height="500" preserveAspectRatio="xMidYMid slice" clip-path="url(#rounded)"/>
  <rect width="800" height="500" fill="url(#gradient)" clip-path="url(#rounded)"/>
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(0,0,0,0);stop-opacity:0"/>
      <stop offset="60%" style="stop-color:rgba(0,0,0,0);stop-opacity:0"/>
      <stop offset="100%" style="stop-color:rgba(0,0,0,0.8);stop-opacity:1"/>
    </linearGradient>
  </defs>
  ${textElements}
  <text x="790" y="490" text-anchor="end" font-family="Arial, sans-serif" font-size="10" fill="rgba(255,255,255,0.5)">C-Lion API v1 | kcodes.me</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-cache",
    },
  });
}

function handleCors(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return handleCors(new Response(null, { status: 204 }));
    }

    // API info endpoint
    if (path === "/") {
      return handleCors(
        new Response(
          JSON.stringify({
            name: "kcodes API",
            version: "1.0.0",
            services: {
              "c-lion": {
                description: "A silly API for sea lion facts and memes",
                endpoints: {
                  "/c-lion/v1/fact": "Get a random sea lion fact",
                  "/c-lion/v1/image": "Get a random sea lion image URL",
                  "/c-lion/v1/meme": "Get a meme (SVG with fact overlay)",
                  "/c-lion/v1/facts": "Get all sea lion facts",
                },
              },
            },
          }),
          {
            headers: { "Content-Type": "application/json" },
          }
        )
      );
    }

    // C-Lion v1 routes
    if (path === "/c-lion/v1/fact") {
      return handleCors(
        new Response(
          JSON.stringify({
            fact: getRandomFact(),
            source: "C-Lion API v1",
          }),
          {
            headers: { "Content-Type": "application/json" },
          }
        )
      );
    }

    if (path === "/c-lion/v1/facts") {
      return handleCors(
        new Response(
          JSON.stringify({
            facts: SEA_LION_FACTS,
            count: SEA_LION_FACTS.length,
            source: "C-Lion API v1",
          }),
          {
            headers: { "Content-Type": "application/json" },
          }
        )
      );
    }

    if (path === "/c-lion/v1/image") {
      const imageUrl = getRandomImage();
      return handleCors(
        new Response(
          JSON.stringify({
            url: imageUrl,
            source: "C-Lion API v1",
          }),
          {
            headers: { "Content-Type": "application/json" },
          }
        )
      );
    }

    if (path === "/c-lion/v1/meme") {
      return handleCors(await generateMeme());
    }

    // 404 for unknown routes
    return handleCors(
      new Response(
        JSON.stringify({
          error: "Not Found",
          message: `Unknown endpoint: ${path}`,
          availableEndpoints: [
            "/c-lion/v1/fact",
            "/c-lion/v1/image",
            "/c-lion/v1/meme",
            "/c-lion/v1/facts",
          ],
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      )
    );
  },
};

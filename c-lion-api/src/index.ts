import { getRandomFact, SEA_LION_FACTS } from "./facts";

interface Env {
  CEREBRAS_API_KEY: string;
}

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

const SYSTEM_PROMPTS = {
  corporate: `You are a corporate buzzword translator. Transform any message into maximum corporate speak while keeping it coherent and roughly conveying the same meaning. Use phrases like "synergize", "leverage", "circle back", "move the needle", "low-hanging fruit", "bandwidth", "deep dive", "align", "pivot", "ecosystem", "stakeholders", "value-add", "actionable insights", "paradigm shift", "scalable solutions", "cross-functional", "deliverables", "KPIs", "ROI", "optimize", "streamline". Make it sound like it came from a middle manager who just attended a leadership seminar. Keep it coherent but maximally corporate. Only output the translated text, nothing else.`,

  legal: `You are a legal jargon translator. Transform any message into dense legalese while keeping it coherent and roughly conveying the same meaning. Use phrases like "hereinafter referred to as", "notwithstanding the foregoing", "pursuant to", "in accordance with", "shall be deemed", "subject to the provisions", "without limitation", "including but not limited to", "to the fullest extent permitted by law", "in witness whereof", "whereas", "hereby", "therein", "thereof", "heretofore", "aforementioned". Add disclaimers, qualifications, and nested clauses. Make it sound like a contract written by an overzealous attorney billing by the word. Keep it coherent but maximally legal. Only output the translated text, nothing else.`,
};

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

async function callCerebras(
  apiKey: string,
  systemPrompt: string,
  userText: string
): Promise<string> {
  const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama3.1-8b",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userText },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cerebras API error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0].message.content;
}

async function getTextFromRequest(request: Request, url: URL): Promise<string | null> {
  // Try query param first (for GET)
  const textParam = url.searchParams.get("text");
  if (textParam) {
    return textParam;
  }

  // For POST, try to parse body
  if (request.method === "POST") {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = (await request.json()) as { text?: string };
      return body.text || null;
    }

    if (contentType.includes("text/plain")) {
      return await request.text();
    }

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      return formData.get("text") as string | null;
    }
  }

  return null;
}

function handleCors(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function jsonResponse(data: object, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return handleCors(new Response(null, { status: 204 }));
    }

    // API info endpoint
    if (path === "/") {
      return handleCors(
        jsonResponse({
          name: "kcodes API",
          version: "1.0.0",
          services: {
            "c-lion": {
              description: "A silly API for sea lion facts and memes",
              endpoints: {
                "GET /c-lion/v1/fact": "Get a random sea lion fact",
                "GET /c-lion/v1/image": "Get a random sea lion image URL",
                "GET /c-lion/v1/meme": "Get a meme (SVG with fact overlay)",
                "GET /c-lion/v1/facts": "Get all sea lion facts",
              },
            },
            jargon: {
              description: "Transform text into corporate or legal jargon",
              endpoints: {
                "GET|POST /jargon/v1/corporate": "Transform text into corporate buzzwords",
                "GET|POST /jargon/v1/legal": "Transform text into dense legalese",
              },
              usage: {
                GET: "/jargon/v1/corporate?text=your message here",
                POST: "Body: { \"text\": \"your message here\" } or plain text",
              },
            },
          },
        })
      );
    }

    // ============ C-Lion v1 routes ============
    if (path === "/c-lion/v1/fact") {
      return handleCors(
        jsonResponse({
          fact: getRandomFact(),
          source: "C-Lion API v1",
        })
      );
    }

    if (path === "/c-lion/v1/facts") {
      return handleCors(
        jsonResponse({
          facts: SEA_LION_FACTS,
          count: SEA_LION_FACTS.length,
          source: "C-Lion API v1",
        })
      );
    }

    if (path === "/c-lion/v1/image") {
      const imageUrl = getRandomImage();
      return handleCors(
        jsonResponse({
          url: imageUrl,
          source: "C-Lion API v1",
        })
      );
    }

    if (path === "/c-lion/v1/meme") {
      return handleCors(await generateMeme());
    }

    // ============ Jargon v1 routes ============
    if (path === "/jargon/v1/corporate" || path === "/jargon/v1/legal") {
      const jargonType = path.includes("corporate") ? "corporate" : "legal";

      if (request.method !== "GET" && request.method !== "POST") {
        return handleCors(
          jsonResponse({ error: "Method not allowed. Use GET or POST." }, 405)
        );
      }

      const text = await getTextFromRequest(request, url);

      if (!text || text.trim().length === 0) {
        return handleCors(
          jsonResponse(
            {
              error: "Missing text parameter",
              usage: {
                GET: `/jargon/v1/${jargonType}?text=your message here`,
                POST: `Body: { "text": "your message here" } or Content-Type: text/plain`,
              },
            },
            400
          )
        );
      }

      if (text.length > 2000) {
        return handleCors(
          jsonResponse({ error: "Text too long. Maximum 2000 characters." }, 400)
        );
      }

      if (!env.CEREBRAS_API_KEY) {
        return handleCors(
          jsonResponse({ error: "Service not configured (missing API key)" }, 503)
        );
      }

      try {
        const result = await callCerebras(
          env.CEREBRAS_API_KEY,
          SYSTEM_PROMPTS[jargonType],
          text
        );

        return handleCors(
          jsonResponse({
            original: text,
            jargonified: result,
            type: jargonType,
            source: "Jargon API v1",
          })
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return handleCors(
          jsonResponse({ error: "Failed to process text", details: message }, 500)
        );
      }
    }

    // 404 for unknown routes
    return handleCors(
      jsonResponse(
        {
          error: "Not Found",
          message: `Unknown endpoint: ${path}`,
          availableEndpoints: [
            "/c-lion/v1/fact",
            "/c-lion/v1/image",
            "/c-lion/v1/meme",
            "/c-lion/v1/facts",
            "/jargon/v1/corporate",
            "/jargon/v1/legal",
          ],
        },
        404
      )
    );
  },
};

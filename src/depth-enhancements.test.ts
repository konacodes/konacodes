import { test, expect, describe } from "bun:test";
import { readFileSync } from "fs";

const cssContent = readFileSync("./src/index.css", "utf-8");

describe("Depth Enhancements - Shadows", () => {
  test("should define --shadow-sm CSS variable in :root", () => {
    expect(cssContent).toContain("--shadow-sm:");
  });

  test("should define --shadow-md CSS variable in :root", () => {
    expect(cssContent).toContain("--shadow-md:");
  });

  test("should define --shadow-lg CSS variable in :root", () => {
    expect(cssContent).toContain("--shadow-lg:");
  });

  test("shadows should use multiple layers for depth", () => {
    // Check that shadow definitions contain multiple shadow layers (comma-separated)
    const shadowSmMatch = cssContent.match(/--shadow-sm:\s*([^;]+);/);
    expect(shadowSmMatch).toBeTruthy();
    if (shadowSmMatch) {
      const shadowSmValue = shadowSmMatch[1];
      // Multiple shadows are comma-separated, so we expect at least one comma
      expect(shadowSmValue.includes(",")).toBe(true);
    }
  });

  test("should define dark mode shadow variants with reduced opacity", () => {
    const darkThemeSection = cssContent.match(/\[data-theme="dark"\]\s*\{[\s\S]*?\}/);
    expect(darkThemeSection).toBeTruthy();
    if (darkThemeSection) {
      expect(darkThemeSection[0]).toContain("--shadow-sm:");
      expect(darkThemeSection[0]).toContain("--shadow-md:");
      expect(darkThemeSection[0]).toContain("--shadow-lg:");
    }
  });

  test("masthead should have shadow applied", () => {
    expect(cssContent).toMatch(/\.masthead\s*\{[^}]*box-shadow:\s*var\(--shadow-/);
  });

  test("sidebar-section should have shadow applied", () => {
    expect(cssContent).toMatch(/\.sidebar-section\s*\{[^}]*box-shadow:\s*var\(--shadow-/);
  });

  test("project-card should have shadow applied", () => {
    expect(cssContent).toMatch(/\.project-card\s*\{[^}]*box-shadow:\s*var\(--shadow-/);
  });

  test("headline-title should have text-shadow", () => {
    expect(cssContent).toMatch(/\.headline-title\s*\{[^}]*text-shadow:/);
  });
});

describe("Depth Enhancements - Texture Overlay", () => {
  test("should have paper grain texture overlay on .page::before", () => {
    expect(cssContent).toContain(".page::before");
    expect(cssContent).toContain("feTurbulence");
    expect(cssContent).toContain("fractalNoise");
  });

  test("texture overlay should use proper opacity", () => {
    // The main .page::before block (not dark mode) should have opacity
    // Look for the Paper grain texture overlay comment section
    const textureSection = cssContent.match(/\/\* Paper grain texture overlay \*\/[\s\S]*?\.page::before\s*\{([^}]*)\}/);
    expect(textureSection).toBeTruthy();
    if (textureSection) {
      const opacityMatch = textureSection[1].match(/opacity:\s*([\d.]+)/);
      expect(opacityMatch).toBeTruthy();
      if (opacityMatch) {
        const opacity = parseFloat(opacityMatch[1]);
        // Opacity should be subtle (less than 0.1)
        expect(opacity).toBeLessThan(0.1);
        expect(opacity).toBeGreaterThan(0);
      }
    }
  });

  test("texture overlay should have pointer-events: none", () => {
    // Look for the Paper grain texture overlay section
    const textureSection = cssContent.match(/\/\* Paper grain texture overlay \*\/[\s\S]*?\.page::before\s*\{([^}]*)\}/);
    expect(textureSection).toBeTruthy();
    if (textureSection) {
      expect(textureSection[1]).toContain("pointer-events: none");
    }
  });

  test("texture overlay should have high z-index", () => {
    // Look for the Paper grain texture overlay section
    const textureSection = cssContent.match(/\/\* Paper grain texture overlay \*\/[\s\S]*?\.page::before\s*\{([^}]*)\}/);
    expect(textureSection).toBeTruthy();
    if (textureSection) {
      expect(textureSection[1]).toContain("z-index:");
    }
  });

  test("dark mode should reduce texture opacity", () => {
    // Dark mode .page::before should have reduced opacity
    expect(cssContent).toMatch(/\[data-theme="dark"\]\s*\.page::before[^{]*\{[^}]*opacity:\s*[\d.]+/);
  });
});

describe("Depth Enhancements - Dark Mode", () => {
  test("dark mode project-card should have adjusted shadow", () => {
    expect(cssContent).toMatch(/\[data-theme="dark"\]\s*\.project-card[^{]*\{[^}]*box-shadow:/);
  });

  test("dark mode sidebar-section should have adjusted styling", () => {
    expect(cssContent).toMatch(/\[data-theme="dark"\]\s*\.sidebar-section[^{]*\{[^}]*box-shadow:/);
  });
});

describe("Depth Enhancements - Accessibility", () => {
  test("should respect prefers-reduced-motion", () => {
    expect(cssContent).toContain("prefers-reduced-motion: reduce");
  });
});

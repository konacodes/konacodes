// Diagram rendering support for blog posts
// Supports: Mermaid (flowcharts, sequence, class, state, ER, pie, gantt, etc.)
//           Chart.js (bar, line, pie, doughnut, radar, etc.)
//           ASCII art (preserved formatting)

export const diagramStyles = `
  /* Diagram container styles */
  .diagram-container {
    margin: 1.5rem 0;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    overflow-x: auto;
  }

  .diagram-container.mermaid-diagram {
    text-align: center;
  }

  .diagram-container.mermaid-diagram svg {
    max-width: 100%;
    height: auto;
  }

  .diagram-container.chart-diagram {
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }

  .diagram-container.chart-diagram canvas {
    max-width: 100%;
  }

  .diagram-container.ascii-diagram {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    line-height: 1.4;
    white-space: pre;
    overflow-x: auto;
  }

  .diagram-error {
    color: #c44;
    font-family: var(--font-mono);
    font-size: 0.85rem;
    padding: 1rem;
    background: rgba(204, 68, 68, 0.1);
    border-radius: 4px;
  }

  /* Mermaid theme overrides for dark mode */
  [data-theme="dark"] .mermaid-diagram {
    --mermaid-bg: transparent;
  }

  [data-theme="dark"] .mermaid-diagram text {
    fill: var(--color-text) !important;
  }

  /* Chart.js dark mode support */
  [data-theme="dark"] .chart-diagram {
    --chart-text-color: #e8e4df;
    --chart-grid-color: rgba(232, 228, 223, 0.1);
  }

  [data-theme="light"] .chart-diagram {
    --chart-text-color: #1a1a18;
    --chart-grid-color: rgba(26, 26, 24, 0.1);
  }
`;

// CDN scripts for diagram libraries
export const diagramScripts = `
  <!-- Mermaid.js for diagrams -->
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <!-- Chart.js for data visualizations -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
`;

// Client-side initialization and rendering code
export const diagramInitScript = `
  <script>
    (function() {
      // Initialize Mermaid with theme support
      function initMermaid() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'default',
          themeVariables: isDark ? {
            primaryColor: '#d4b078',
            primaryTextColor: '#e8e4df',
            primaryBorderColor: '#2a2826',
            lineColor: '#7a766f',
            secondaryColor: '#2a2826',
            tertiaryColor: '#1a1917',
            background: '#0f0e0d',
            mainBkg: '#1a1917',
            nodeBorder: '#d4b078',
            clusterBkg: '#1a1917',
            titleColor: '#e8e4df',
            edgeLabelBackground: '#1a1917'
          } : {
            primaryColor: '#c9a66b',
            primaryTextColor: '#1a1a18',
            primaryBorderColor: '#d4d0c8',
            lineColor: '#8a8a82',
            secondaryColor: '#f8f5f0',
            tertiaryColor: '#fff',
            background: '#f8f5f0',
            mainBkg: '#fff',
            nodeBorder: '#c9a66b',
            clusterBkg: '#f8f5f0',
            titleColor: '#1a1a18',
            edgeLabelBackground: '#fff'
          },
          flowchart: { curve: 'basis', padding: 20 },
          sequence: { actorMargin: 50, messageMargin: 40 },
          gantt: { leftPadding: 75, gridLineStartPadding: 35 }
        });
      }

      // Render all Mermaid diagrams
      async function renderMermaidDiagrams() {
        const diagrams = document.querySelectorAll('.mermaid-source');
        for (const el of diagrams) {
          const container = el.closest('.diagram-container');
          const code = el.textContent;
          try {
            const id = 'mermaid-' + Math.random().toString(36).substr(2, 9);
            const { svg } = await mermaid.render(id, code);
            container.innerHTML = svg;
            container.classList.add('mermaid-rendered');
          } catch (err) {
            container.innerHTML = '<div class="diagram-error">Diagram error: ' + err.message + '</div>';
            console.error('Mermaid error:', err);
          }
        }
      }

      // Render all Chart.js diagrams
      function renderChartDiagrams() {
        const charts = document.querySelectorAll('.chart-source');
        charts.forEach(el => {
          const container = el.closest('.diagram-container');
          const code = el.textContent;
          try {
            const config = JSON.parse(code);
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            const textColor = isDark ? '#e8e4df' : '#1a1a18';
            const gridColor = isDark ? 'rgba(232, 228, 223, 0.1)' : 'rgba(26, 26, 24, 0.1)';

            // Apply theme colors to config
            if (!config.options) config.options = {};
            if (!config.options.plugins) config.options.plugins = {};
            if (!config.options.plugins.legend) config.options.plugins.legend = {};
            config.options.plugins.legend.labels = { color: textColor };

            if (!config.options.scales) config.options.scales = {};
            ['x', 'y'].forEach(axis => {
              if (!config.options.scales[axis]) config.options.scales[axis] = {};
              config.options.scales[axis].ticks = { color: textColor };
              config.options.scales[axis].grid = { color: gridColor };
            });

            // Create canvas and render chart
            const canvas = document.createElement('canvas');
            container.innerHTML = '';
            container.appendChild(canvas);
            new Chart(canvas.getContext('2d'), config);
            container.classList.add('chart-rendered');
          } catch (err) {
            container.innerHTML = '<div class="diagram-error">Chart error: ' + err.message + '</div>';
            console.error('Chart.js error:', err);
          }
        });
      }

      // Main render function
      window.renderDiagrams = async function() {
        if (typeof mermaid !== 'undefined') {
          initMermaid();
          await renderMermaidDiagrams();
        }
        if (typeof Chart !== 'undefined') {
          renderChartDiagrams();
        }
      };

      // Re-render on theme change
      const originalToggle = document.getElementById('theme-toggle');
      if (originalToggle) {
        originalToggle.addEventListener('click', () => {
          setTimeout(() => {
            // Re-initialize and re-render diagrams with new theme
            window.renderDiagrams();
          }, 700);
        });
      }

      // Initial render when DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', window.renderDiagrams);
      } else {
        window.renderDiagrams();
      }
    })();
  </script>
`;

// Supported diagram types for reference
export const DIAGRAM_TYPES = {
  // Mermaid diagram types
  mermaid: ['mermaid', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram',
            'erDiagram', 'gantt', 'pie', 'journey', 'gitGraph', 'mindmap', 'timeline',
            'quadrantChart', 'sankey', 'xychart'],
  // Chart.js types
  chart: ['chart', 'barchart', 'linechart', 'piechart', 'doughnut', 'radar', 'polar'],
  // ASCII art
  ascii: ['ascii', 'diagram', 'art']
};

// Transform diagram code blocks to renderable HTML
export function transformDiagramBlock(lang: string, code: string): string | null {
  const langLower = lang.toLowerCase();

  // Mermaid diagrams
  if (DIAGRAM_TYPES.mermaid.includes(langLower)) {
    const mermaidCode = langLower === 'mermaid' ? code : code;
    return `<div class="diagram-container mermaid-diagram"><div class="mermaid-source" style="display:none;">${escapeHtml(mermaidCode)}</div><div class="diagram-loading">Loading diagram...</div></div>`;
  }

  // Chart.js diagrams
  if (DIAGRAM_TYPES.chart.includes(langLower)) {
    return `<div class="diagram-container chart-diagram"><div class="chart-source" style="display:none;">${escapeHtml(code)}</div><div class="diagram-loading">Loading chart...</div></div>`;
  }

  // ASCII art
  if (DIAGRAM_TYPES.ascii.includes(langLower)) {
    return `<div class="diagram-container ascii-diagram">${escapeHtml(code)}</div>`;
  }

  return null;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

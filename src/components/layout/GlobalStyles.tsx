interface GlobalStylesProps {
  isDark: boolean;
}

export default function GlobalStyles({ isDark }: GlobalStylesProps) {
  return (
    <style>{`
      ${
        isDark
          ? `
        :root, * {
          --color-background-primary: #1e293b;
          --color-background-secondary: #0f172a;
          --color-text-primary: #f1f5f9;
          --color-text-secondary: #94a3b8;
          --color-border-tertiary: #334155;
        }
      `
          : ''
      }
      @media print {
        body { margin: 0 !important; }
        [data-sidebar] { display: none !important; }
        [data-main] {
          overflow: visible !important;
          height: auto !important;
          position: static !important;
        }
        [data-main] > div { overflow: visible !important; height: auto !important; }
        [data-main] [data-content] {
          overflow: visible !important;
          height: auto !important;
          max-height: none !important;
          padding: 0 !important;
        }
        div[style*="maxHeight"], div[style*="max-height"],
        pre, div[style*="overflow"] {
          max-height: none !important;
          overflow: visible !important;
        }
        button, select, input[type="checkbox"], input[type="file"],
        [data-noprint] { display: none !important; }
        [data-tabbar] button { display: none !important; }
        [data-tabbar] [data-tabinfo] { display: block !important; font-size: 14pt !important; font-weight: bold !important; }
        [data-print-header] { display: block !important; }
        .panel { break-inside: avoid; }
        .export-tab-section { page-break-before: always; }
        .export-tab-header { display: block !important; }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
      }
      @media screen { [data-print-header] { display: none; } }
      @keyframes esc-row-flash {
        0%   { background-color: #dbeafe; }
        100% { background-color: transparent; }
      }
      @keyframes esc-row-flash-dark {
        0%   { background-color: #1e3a5f; }
        100% { background-color: transparent; }
      }
      @keyframes esc-badge-pulse {
        0%, 100% { opacity: 1; }
        50%      { opacity: 0.5; }
      }
      @keyframes esc-seg-appear {
        0%   { opacity: 0; transform: translateY(6px) scaleX(0.7); }
        100% { opacity: 1; transform: translateY(0) scaleX(1); }
      }
    `}</style>
  );
}

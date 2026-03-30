/** Sampul indikator PipHunter — disajikan via /api/indikator-cover/[id] agar stabil di Vercel (tanpa bergantung pada static public). */

export const INDICATOR_COVER_IDS = [
  "rsi",
  "ma-cross",
  "macd",
  "sr-zones",
  "session-hilo",
] as const;

export type IndicatorCoverId = (typeof INDICATOR_COVER_IDS)[number];

const COVER_SVG: Record<IndicatorCoverId, string> = {
  rsi: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450" role="img" aria-label="Ilustrasi RSI">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f1419"/>
      <stop offset="100%" stop-color="#0b0e11"/>
    </linearGradient>
  </defs>
  <rect width="800" height="450" fill="url(#bg)"/>
  <rect x="48" y="48" width="704" height="320" rx="8" fill="#1a1f26" stroke="#2ebd85" stroke-opacity="0.35"/>
  <polyline fill="none" stroke="#2ebd85" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
    points="80,280 140,260 200,300 260,220 320,250 380,200 440,240 500,180 560,210 620,160 680,190 720,170"/>
  <line x1="80" y1="320" x2="720" y2="320" stroke="#eaecef" stroke-opacity="0.15" stroke-width="1"/>
  <text x="400" y="40" text-anchor="middle" fill="#eaecef" font-family="system-ui,sans-serif" font-size="22" font-weight="600">RSI — osilator momentum</text>
  <text x="400" y="410" text-anchor="middle" fill="#848e9c" font-family="system-ui,sans-serif" font-size="13">PipHunter · GMR FX · contoh visual</text>
</svg>`,
  "ma-cross": `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450" role="img" aria-label="Ilustrasi Moving Average">
  <rect width="800" height="450" fill="#0b0e11"/>
  <rect x="48" y="56" width="704" height="300" rx="8" fill="#141a20" stroke="#f0b90b" stroke-opacity="0.4"/>
  <polyline fill="none" stroke="#f0b90b" stroke-width="2.5" stroke-linecap="round"
    points="72,300 120,290 180,270 240,250 300,260 360,230 420,240 480,200 540,220 600,180 660,200 728,175"/>
  <polyline fill="none" stroke="#2ebd85" stroke-width="2.5" stroke-linecap="round"
    points="72,320 130,310 190,300 250,280 310,290 370,260 430,270 490,230 550,250 610,210 670,230 728,205"/>
  <text x="400" y="40" text-anchor="middle" fill="#eaecef" font-family="system-ui,sans-serif" font-size="22" font-weight="600">Persilangan Moving Average</text>
  <text x="400" y="400" text-anchor="middle" fill="#848e9c" font-family="system-ui,sans-serif" font-size="13">PipHunter · GMR FX · contoh visual</text>
</svg>`,
  macd: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450" role="img" aria-label="Ilustrasi MACD">
  <rect width="800" height="450" fill="#0b0e11"/>
  <rect x="48" y="56" width="704" height="140" rx="8" fill="#141a20" stroke="#eaecef" stroke-opacity="0.12"/>
  <rect x="48" y="214" width="704" height="150" rx="8" fill="#141a20" stroke="#2ebd85" stroke-opacity="0.35"/>
  <rect x="100" y="280" width="24" height="60" rx="2" fill="#2ebd85" fill-opacity="0.85"/>
  <rect x="180" y="300" width="24" height="40" rx="2" fill="#f6465d" fill-opacity="0.85"/>
  <rect x="260" y="265" width="24" height="75" rx="2" fill="#2ebd85" fill-opacity="0.85"/>
  <rect x="340" y="310" width="24" height="30" rx="2" fill="#f6465d" fill-opacity="0.7"/>
  <rect x="420" y="255" width="24" height="85" rx="2" fill="#2ebd85" fill-opacity="0.9"/>
  <text x="400" y="40" text-anchor="middle" fill="#eaecef" font-family="system-ui,sans-serif" font-size="22" font-weight="600">MACD — histogram</text>
  <text x="400" y="400" text-anchor="middle" fill="#848e9c" font-family="system-ui,sans-serif" font-size="13">PipHunter · GMR FX · contoh visual</text>
</svg>`,
  "sr-zones": `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450" role="img" aria-label="Ilustrasi support resistance">
  <rect width="800" height="450" fill="#0b0e11"/>
  <rect x="48" y="56" width="704" height="320" rx="8" fill="#141a20" stroke="#eaecef" stroke-opacity="0.1"/>
  <line x1="72" y1="120" x2="728" y2="120" stroke="#f6465d" stroke-opacity="0.7" stroke-width="2" stroke-dasharray="10 6"/>
  <line x1="72" y1="220" x2="728" y2="220" stroke="#2ebd85" stroke-opacity="0.7" stroke-width="2" stroke-dasharray="10 6"/>
  <line x1="72" y1="320" x2="728" y2="320" stroke="#f0b90b" stroke-opacity="0.6" stroke-width="2" stroke-dasharray="10 6"/>
  <polyline fill="none" stroke="#eaecef" stroke-width="2.2" stroke-linecap="round"
    points="72,340 130,300 200,320 280,240 360,280 440,200 520,250 600,190 680,230 728,210"/>
  <text x="400" y="40" text-anchor="middle" fill="#eaecef" font-family="system-ui,sans-serif" font-size="22" font-weight="600">Zona Support &amp; Resistance</text>
  <text x="400" y="410" text-anchor="middle" fill="#848e9c" font-family="system-ui,sans-serif" font-size="13">PipHunter · GMR FX · contoh visual</text>
</svg>`,
  "session-hilo": `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450" role="img" aria-label="Ilustrasi high low sesi">
  <rect width="800" height="450" fill="#0b0e11"/>
  <rect x="48" y="56" width="704" height="320" rx="8" fill="#141a20" stroke="#2ebd85" stroke-opacity="0.25"/>
  <line x1="200" y1="80" x2="200" y2="352" stroke="#eaecef" stroke-opacity="0.12" stroke-width="1"/>
  <line x1="400" y1="80" x2="400" y2="352" stroke="#eaecef" stroke-opacity="0.12" stroke-width="1"/>
  <line x1="600" y1="80" x2="600" y2="352" stroke="#eaecef" stroke-opacity="0.12" stroke-width="1"/>
  <rect x="90" y="140" width="180" height="8" rx="2" fill="#f6465d" fill-opacity="0.85"/>
  <text x="180" y="130" text-anchor="middle" fill="#f6465d" font-size="11" font-family="system-ui,sans-serif">High sesi</text>
  <rect x="310" y="280" width="180" height="8" rx="2" fill="#2ebd85" fill-opacity="0.85"/>
  <text x="400" y="310" text-anchor="middle" fill="#2ebd85" font-size="11" font-family="system-ui,sans-serif">Low sesi</text>
  <text x="400" y="40" text-anchor="middle" fill="#eaecef" font-family="system-ui,sans-serif" font-size="22" font-weight="600">Penanda High / Low sesi</text>
  <text x="400" y="410" text-anchor="middle" fill="#848e9c" font-family="system-ui,sans-serif" font-size="13">PipHunter · GMR FX · contoh visual</text>
</svg>`,
};

export function getIndicatorCoverSvg(id: string): string | null {
  const k = id.toLowerCase() as IndicatorCoverId;
  return COVER_SVG[k] ?? null;
}

export function isIndicatorCoverId(id: string): boolean {
  return INDICATOR_COVER_IDS.includes(id.toLowerCase() as IndicatorCoverId);
}

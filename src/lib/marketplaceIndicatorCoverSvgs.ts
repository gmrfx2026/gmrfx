/** Sampul indikator PipHunter — disajikan via /api/indikator-cover/[id] agar stabil di Vercel (tanpa bergantung pada static public). */

export const INDICATOR_COVER_IDS = [
  "rsi",
  "ma-cross",
  "macd",
  "sr-zones",
  "session-hilo",
  "bollinger-bands",
  "stochastic",
  "atr",
  "fibonacci",
  "pivot-points",
  "ichimoku",
  "cci",
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
  "bollinger-bands": `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450" role="img" aria-label="Ilustrasi Bollinger Bands">
  <rect width="800" height="450" fill="#0b0e11"/>
  <rect x="48" y="56" width="704" height="320" rx="8" fill="#141a20" stroke="#8b5cf6" stroke-opacity="0.35"/>
  <path fill="none" stroke="#8b5cf6" stroke-width="2" stroke-opacity="0.6" d="M72,200 Q200,120 360,180 T728,160"/>
  <path fill="none" stroke="#f0b90b" stroke-width="2.5" stroke-linecap="round"
    d="M72,220 L728,200"/>
  <path fill="none" stroke="#8b5cf6" stroke-width="2" stroke-opacity="0.6" d="M72,260 Q220,340 400,280 T728,300"/>
  <polyline fill="none" stroke="#eaecef" stroke-width="2" stroke-linecap="round"
    points="72,240 140,200 220,230 300,170 400,210 500,150 600,200 728,175"/>
  <text x="400" y="40" text-anchor="middle" fill="#eaecef" font-family="system-ui,sans-serif" font-size="22" font-weight="600">Bollinger Bands</text>
  <text x="400" y="410" text-anchor="middle" fill="#848e9c" font-family="system-ui,sans-serif" font-size="13">PipHunter · GMR FX · contoh visual</text>
</svg>`,
  stochastic: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450" role="img" aria-label="Ilustrasi Stochastic">
  <rect width="800" height="450" fill="#0b0e11"/>
  <rect x="48" y="56" width="704" height="180" rx="8" fill="#141a20" stroke="#eaecef" stroke-opacity="0.08"/>
  <rect x="48" y="250" width="704" height="126" rx="8" fill="#141a20" stroke="#f0b90b" stroke-opacity="0.35"/>
  <line x1="72" y1="280" x2="728" y2="280" stroke="#f6465d" stroke-opacity="0.5" stroke-width="1" stroke-dasharray="6 4"/>
  <line x1="72" y1="330" x2="728" y2="330" stroke="#2ebd85" stroke-opacity="0.5" stroke-width="1" stroke-dasharray="6 4"/>
  <polyline fill="none" stroke="#f0b90b" stroke-width="2.5" stroke-linecap="round"
    points="72,310 140,290 200,320 280,270 360,300 440,260 520,290 600,250 680,275 728,265"/>
  <polyline fill="none" stroke="#2ebd85" stroke-width="2" stroke-linecap="round" stroke-opacity="0.9"
    points="72,325 150,305 210,335 290,285 370,315 450,275 530,305 610,265 728,285"/>
  <text x="400" y="40" text-anchor="middle" fill="#eaecef" font-family="system-ui,sans-serif" font-size="22" font-weight="600">Stochastic — osilator</text>
  <text x="400" y="400" text-anchor="middle" fill="#848e9c" font-family="system-ui,sans-serif" font-size="13">PipHunter · GMR FX · contoh visual</text>
</svg>`,
  atr: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450" role="img" aria-label="Ilustrasi ATR">
  <rect width="800" height="450" fill="#0b0e11"/>
  <rect x="48" y="56" width="704" height="320" rx="8" fill="#141a20" stroke="#2ebd85" stroke-opacity="0.25"/>
  <polyline fill="none" stroke="#eaecef" stroke-width="2" stroke-linecap="round" stroke-opacity="0.85"
    points="80,280 140,260 200,300 260,220 320,250 380,200 440,240 500,180 560,210 620,160 680,190 720,170"/>
  <polyline fill="none" stroke="#f0b90b" stroke-width="2.5" stroke-linecap="round"
    points="80,340 140,320 200,360 260,300 320,330 380,280 440,320 500,260 560,290 620,240 680,270 720,250"/>
  <text x="400" y="40" text-anchor="middle" fill="#eaecef" font-family="system-ui,sans-serif" font-size="22" font-weight="600">ATR — volatilitas rata-rata</text>
  <text x="400" y="410" text-anchor="middle" fill="#848e9c" font-family="system-ui,sans-serif" font-size="13">PipHunter · GMR FX · contoh visual</text>
</svg>`,
  fibonacci: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450" role="img" aria-label="Ilustrasi Fibonacci">
  <rect width="800" height="450" fill="#0b0e11"/>
  <rect x="48" y="56" width="704" height="320" rx="8" fill="#141a20" stroke="#eaecef" stroke-opacity="0.1"/>
  <line x1="72" y1="110" x2="728" y2="110" stroke="#f6465d" stroke-opacity="0.55" stroke-width="1" stroke-dasharray="8 5"/>
  <text x="740" y="114" fill="#848e9c" font-size="11" font-family="system-ui,sans-serif">100%</text>
  <line x1="72" y1="165" x2="728" y2="165" stroke="#f0b90b" stroke-opacity="0.45" stroke-width="1" stroke-dasharray="8 5"/>
  <text x="740" y="169" fill="#848e9c" font-size="11" font-family="system-ui,sans-serif">61.8%</text>
  <line x1="72" y1="220" x2="728" y2="220" stroke="#eaecef" stroke-opacity="0.2" stroke-width="1" stroke-dasharray="8 5"/>
  <text x="740" y="224" fill="#848e9c" font-size="11" font-family="system-ui,sans-serif">50%</text>
  <line x1="72" y1="275" x2="728" y2="275" stroke="#2ebd85" stroke-opacity="0.45" stroke-width="1" stroke-dasharray="8 5"/>
  <text x="740" y="279" fill="#848e9c" font-size="11" font-family="system-ui,sans-serif">38.2%</text>
  <line x1="72" y1="330" x2="728" y2="330" stroke="#2ebd85" stroke-opacity="0.65" stroke-width="1" stroke-dasharray="8 5"/>
  <text x="740" y="334" fill="#848e9c" font-size="11" font-family="system-ui,sans-serif">0%</text>
  <polyline fill="none" stroke="#eaecef" stroke-width="2" stroke-linecap="round" stroke-opacity="0.7"
    points="72,110 200,200 320,165 440,275 560,220 680,330"/>
  <text x="400" y="40" text-anchor="middle" fill="#eaecef" font-family="system-ui,sans-serif" font-size="22" font-weight="600">Level Fibonacci retracement</text>
  <text x="400" y="410" text-anchor="middle" fill="#848e9c" font-family="system-ui,sans-serif" font-size="13">PipHunter · GMR FX · contoh visual</text>
</svg>`,
  "pivot-points": `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450" role="img" aria-label="Ilustrasi pivot">
  <rect width="800" height="450" fill="#0b0e11"/>
  <rect x="48" y="56" width="704" height="320" rx="8" fill="#141a20" stroke="#2ebd85" stroke-opacity="0.2"/>
  <line x1="72" y1="130" x2="728" y2="130" stroke="#f6465d" stroke-opacity="0.65" stroke-width="2"/>
  <text x="90" y="125" fill="#f6465d" font-size="12" font-family="system-ui,sans-serif">R2</text>
  <line x1="72" y1="180" x2="728" y2="180" stroke="#f0b90b" stroke-opacity="0.55" stroke-width="2"/>
  <text x="90" y="175" fill="#f0b90b" font-size="12" font-family="system-ui,sans-serif">R1</text>
  <line x1="72" y1="230" x2="728" y2="230" stroke="#eaecef" stroke-opacity="0.35" stroke-width="2"/>
  <text x="90" y="225" fill="#eaecef" font-size="12" font-family="system-ui,sans-serif">P</text>
  <line x1="72" y1="280" x2="728" y2="280" stroke="#2ebd85" stroke-opacity="0.55" stroke-width="2"/>
  <text x="90" y="275" fill="#2ebd85" font-size="12" font-family="system-ui,sans-serif">S1</text>
  <line x1="72" y1="330" x2="728" y2="330" stroke="#2ebd85" stroke-opacity="0.75" stroke-width="2"/>
  <text x="90" y="325" fill="#2ebd85" font-size="12" font-family="system-ui,sans-serif">S2</text>
  <polyline fill="none" stroke="#eaecef" stroke-width="2.2" stroke-linecap="round" stroke-opacity="0.8"
    points="72,340 180,200 300,250 420,160 540,220 680,190 728,210"/>
  <text x="400" y="40" text-anchor="middle" fill="#eaecef" font-family="system-ui,sans-serif" font-size="22" font-weight="600">Pivot point — R / P / S</text>
  <text x="400" y="410" text-anchor="middle" fill="#848e9c" font-family="system-ui,sans-serif" font-size="13">PipHunter · GMR FX · contoh visual</text>
</svg>`,
  ichimoku: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450" role="img" aria-label="Ilustrasi Ichimoku">
  <rect width="800" height="450" fill="#0b0e11"/>
  <rect x="48" y="56" width="704" height="320" rx="8" fill="#141a20" stroke="#eaecef" stroke-opacity="0.08"/>
  <path fill="#2ebd85" fill-opacity="0.15" stroke="none" d="M120,200 L280,240 L440,180 L600,220 L680,200 L680,260 L440,300 L280,260 L120,240 Z"/>
  <polyline fill="none" stroke="#f6465d" stroke-width="2" stroke-linecap="round"
    points="72,280 180,250 300,270 420,200 540,240 660,210 728,195"/>
  <polyline fill="none" stroke="#2ebd85" stroke-width="2" stroke-linecap="round" stroke-opacity="0.9"
    points="72,300 200,280 320,300 440,230 560,270 680,240 728,220"/>
  <polyline fill="none" stroke="#f0b90b" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="4 3"
    points="72,260 160,240 280,255 400,190 520,230 640,200 728,185"/>
  <text x="400" y="40" text-anchor="middle" fill="#eaecef" font-family="system-ui,sans-serif" font-size="22" font-weight="600">Ichimoku — awan &amp; garis</text>
  <text x="400" y="410" text-anchor="middle" fill="#848e9c" font-family="system-ui,sans-serif" font-size="13">PipHunter · GMR FX · contoh visual</text>
</svg>`,
  cci: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450" role="img" aria-label="Ilustrasi CCI">
  <rect width="800" height="450" fill="#0b0e11"/>
  <rect x="48" y="56" width="704" height="160" rx="8" fill="#141a20" stroke="#eaecef" stroke-opacity="0.08"/>
  <rect x="48" y="230" width="704" height="146" rx="8" fill="#141a20" stroke="#8b5cf6" stroke-opacity="0.35"/>
  <line x1="72" y1="260" x2="728" y2="260" stroke="#eaecef" stroke-opacity="0.2" stroke-width="1"/>
  <text x="82" y="256" fill="#848e9c" font-size="10" font-family="system-ui,sans-serif">+100</text>
  <line x1="72" y1="303" x2="728" y2="303" stroke="#2ebd85" stroke-opacity="0.4" stroke-width="1" stroke-dasharray="6 4"/>
  <text x="82" y="307" fill="#2ebd85" font-size="10" font-family="system-ui,sans-serif">0</text>
  <line x1="72" y1="346" x2="728" y2="346" stroke="#eaecef" stroke-opacity="0.2" stroke-width="1"/>
  <text x="82" y="352" fill="#848e9c" font-size="10" font-family="system-ui,sans-serif">-100</text>
  <polyline fill="none" stroke="#8b5cf6" stroke-width="2.8" stroke-linecap="round"
    points="72,315 120,280 180,320 240,270 300,310 360,250 420,300 480,240 540,290 600,260 660,300 728,275"/>
  <text x="400" y="40" text-anchor="middle" fill="#eaecef" font-family="system-ui,sans-serif" font-size="22" font-weight="600">CCI — Commodity Channel Index</text>
  <text x="400" y="400" text-anchor="middle" fill="#848e9c" font-family="system-ui,sans-serif" font-size="13">PipHunter · GMR FX · contoh visual</text>
</svg>`,
};

export function getIndicatorCoverSvg(id: string): string | null {
  const k = id.toLowerCase() as IndicatorCoverId;
  return COVER_SVG[k] ?? null;
}

export function isIndicatorCoverId(id: string): boolean {
  return INDICATOR_COVER_IDS.includes(id.toLowerCase() as IndicatorCoverId);
}

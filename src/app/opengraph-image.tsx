import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "GMR FX — Komunitas Trader, Edukasi & Berbagi Strategi";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0b0e11 0%, #131720 60%, #0f1a2e 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          padding: "60px 72px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "4px",
            background: "linear-gradient(90deg, #3b82f6, #06b6d4, #10b981)",
          }}
        />

        {/* Logo mark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              fontWeight: "800",
              color: "#fff",
            }}
          >
            G
          </div>
          <span
            style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "#e2e8f0",
              letterSpacing: "-0.5px",
            }}
          >
            GMR FX
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: "52px",
            fontWeight: "800",
            color: "#f1f5f9",
            lineHeight: 1.15,
            letterSpacing: "-1px",
            maxWidth: "900px",
            marginBottom: "20px",
          }}
        >
          Komunitas Trader
          <br />
          <span
            style={{
              background: "linear-gradient(90deg, #3b82f6, #06b6d4)",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            Indonesia
          </span>
        </div>

        {/* Subtext */}
        <div
          style={{
            fontSize: "24px",
            color: "#94a3b8",
            maxWidth: "780px",
            lineHeight: 1.5,
          }}
        >
          Edukasi forex · Copy trading · Marketplace Indikator & EA · Berbagi strategi
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            top: "52px",
            right: "72px",
            fontSize: "16px",
            color: "#475569",
          }}
        >
          gmrfx.app
        </div>
      </div>
    ),
    size,
  );
}

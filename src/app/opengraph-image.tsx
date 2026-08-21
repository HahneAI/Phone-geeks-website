import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Phone Geeks — Phone, Computer & Tablet Repair in St. Louis";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background:
            "radial-gradient(circle at 15% 20%, rgba(37,99,235,0.35), transparent 40%), radial-gradient(circle at 85% 0%, rgba(224,51,44,0.35), transparent 45%), #0b2a4a",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#e0332c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 20,
                height: 32,
                borderRadius: 5,
                border: "3px solid white",
              }}
            />
          </div>
          <div style={{ fontSize: 36, fontWeight: 700 }}>Phone Geeks</div>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 48,
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.1,
            maxWidth: 900,
          }}
        >
          Revive your tech. One hour, one-year warranty.
        </div>

        <div style={{ display: "flex", marginTop: 32, fontSize: 28, color: "rgba(255,255,255,0.7)" }}>
          Phone, computer &amp; tablet repair in St. Louis
        </div>
      </div>
    ),
    { ...size }
  );
}

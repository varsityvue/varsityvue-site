import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function ScoreboardOpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "72px 88px",
        background: "#05070A",
        color: "white",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ color: "#C8102E", fontSize: 28, fontWeight: 800, letterSpacing: 5 }}>
        VARSITYVUE
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginTop: 28,
          fontSize: 72,
          fontWeight: 900,
          lineHeight: 1.02,
        }}
      >
        <span>Texas High School</span>
        <span>Football Scores</span>
      </div>
      <div style={{ marginTop: 28, fontSize: 28, color: "#B7BDC8" }}>
        Verified finals, live games, and upcoming kickoffs.
      </div>
    </div>,
    size
  );
}

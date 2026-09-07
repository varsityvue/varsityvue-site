import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #050505 0%, #111111 55%, #4f0b16 100%)",
          color: "white",
          padding: "64px 72px",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 22,
              border: "4px solid rgba(255,255,255,0.9)",
              background: "#7b1220",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 62,
              fontWeight: 900,
              lineHeight: 1,
            }}
          >
            V
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: "0.06em" }}>
              VARSITYVUE
            </div>
            <div style={{ marginTop: 6, fontSize: 18, color: "rgba(255,255,255,0.62)", letterSpacing: "0.14em" }}>
              TEXAS HIGH SCHOOL FOOTBALL
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: 930 }}>
          <div style={{ fontSize: 72, lineHeight: 1.02, fontWeight: 900, letterSpacing: "-0.035em" }}>
            Scores. Stats. School Hubs. Local Coverage.
          </div>
          <div style={{ marginTop: 24, fontSize: 28, lineHeight: 1.35, color: "rgba(255,255,255,0.7)" }}>
            Follow the programs, players, matchups and district races that matter across the VarsityVue coverage area.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 20, fontWeight: 700 }}>
          <div style={{ color: "rgba(255,255,255,0.55)" }}>2026 FOOTBALL SEASON</div>
          <div style={{ color: "white" }}>VarsityVue.com</div>
        </div>
      </div>
    ),
    size
  );
}

import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function PlayersOpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#05070A",
          color: "white",
          padding: "64px 72px",
          borderTop: "18px solid #8B1020",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "22px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "88px",
              height: "88px",
              borderRadius: "20px",
              background: "#8B1020",
              color: "#F3E9D5",
              fontSize: "58px",
              fontWeight: 900,
            }}
          >
            V
          </div>
          <div style={{ display: "flex", fontSize: "34px", fontWeight: 900, letterSpacing: "-1px" }}>
            VarsityVue
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "980px" }}>
          <div
            style={{
              display: "flex",
              color: "#C8102E",
              fontSize: "24px",
              fontWeight: 800,
              letterSpacing: "3px",
              textTransform: "uppercase",
            }}
          >
            Player Profiles
          </div>
          <div style={{ display: "flex", fontSize: "64px", lineHeight: 1.02, fontWeight: 900, letterSpacing: "-2px" }}>
            Texas High School Football Player Stats
          </div>
          <div style={{ display: "flex", fontSize: "27px", lineHeight: 1.35, color: "rgba(255,255,255,0.68)" }}>
            Verified season totals, game-by-game production, and school context for players tracked by VarsityVue.
          </div>
        </div>

        <div style={{ display: "flex", fontSize: "20px", fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>
          varsityvue.com
        </div>
      </div>
    ),
    size
  );
}

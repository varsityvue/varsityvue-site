import { ImageResponse } from "next/og";

export const alt = "VarsityVue Pick ’Em — Pick the winners. Climb the leaderboard.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function PickemOpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        padding: "56px 72px",
        color: "#ffffff",
        background: "radial-gradient(circle at 90% 15%, #671322 0%, transparent 42%), linear-gradient(135deg, #08090c 0%, #141016 100%)",
        borderTop: "16px solid #a71932",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", fontSize: 38, fontWeight: 800, letterSpacing: "-1px" }}>
        <span>Varsity</span><span style={{ color: "#d13a50" }}>Vue</span>
        <span style={{ marginLeft: 24, paddingLeft: 24, borderLeft: "2px solid #55424a", fontSize: 19, fontWeight: 700, letterSpacing: "3px", color: "#d6b6bd" }}>TEXAS HIGH SCHOOL FOOTBALL</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", color: "#d13a50", fontSize: 24, fontWeight: 800, letterSpacing: "4px" }}>WEEKLY PICKS · SEASON LEADERBOARD</div>
        <div style={{ display: "flex", marginTop: 16, fontSize: 108, fontWeight: 900, letterSpacing: "-5px", lineHeight: 1 }}>PICK ’EM</div>
        <div style={{ display: "flex", marginTop: 24, fontSize: 32, color: "#e7dce0" }}>Pick the winners. Climb the leaderboard.</div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 22, fontWeight: 700 }}>
        <span style={{ color: "#a99da1" }}>EVERY CORRECT PICK EARNS A POINT</span>
        <span>VarsityVue.com/pickem</span>
      </div>
    </div>,
    size,
  );
}

import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

const logoUrl = "https://varsityvue.com/logos/varsityvue-logo.png";

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
          background:
            "radial-gradient(circle at 14% 8%, rgba(139,16,32,0.62), transparent 30%), linear-gradient(135deg, #050505 0%, #111111 58%, #4f0b16 100%)",
          color: "white",
          padding: "58px 68px",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 104,
              height: 104,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={logoUrl}
              width="104"
              height="104"
              alt=""
              style={{ objectFit: "contain" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                fontSize: 42,
                fontWeight: 900,
                letterSpacing: "-0.025em",
              }}
            >
              <span>Varsity</span>
              <span style={{ color: "#B2192F" }}>Vue</span>
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 18,
                color: "rgba(255,255,255,0.62)",
                letterSpacing: "0.18em",
                fontWeight: 800,
              }}
            >
              TEXAS HIGH SCHOOL FOOTBALL
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: 980 }}>
          <div
            style={{
              fontSize: 70,
              lineHeight: 1.02,
              fontWeight: 900,
              letterSpacing: "-0.04em",
            }}
          >
            Scores. Stats. School Hubs. Local Coverage.
          </div>
          <div
            style={{
              marginTop: 24,
              maxWidth: 920,
              fontSize: 28,
              lineHeight: 1.35,
              color: "rgba(255,255,255,0.72)",
            }}
          >
            Follow the programs, players, matchups and district races that matter across the VarsityVue coverage area.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 20,
            fontWeight: 800,
          }}
        >
          <div style={{ color: "rgba(255,255,255,0.5)" }}>
            2026 FOOTBALL SEASON
          </div>
          <div style={{ color: "white" }}>VarsityVue.com</div>
        </div>
      </div>
    ),
    size,
  );
}

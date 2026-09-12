import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #05070A 0%, #11151B 100%)",
          color: "white",
          border: "10px solid #8B1020",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1,
          }}
        >
          <div style={{ fontSize: 92, fontWeight: 900, letterSpacing: -7 }}>V</div>
          <div style={{ marginTop: 7, fontSize: 14, fontWeight: 900, letterSpacing: 2 }}>
            VARSITYVUE
          </div>
        </div>
      </div>
    ),
    size
  );
}

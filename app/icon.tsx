import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
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
          border: "28px solid #8B1020",
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
          <div style={{ fontSize: 238, fontWeight: 900, letterSpacing: -18 }}>V</div>
          <div style={{ marginTop: 18, fontSize: 40, fontWeight: 900, letterSpacing: 5 }}>
            VARSITYVUE
          </div>
        </div>
      </div>
    ),
    size
  );
}

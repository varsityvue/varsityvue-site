import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "VarsityVue Pick ’Em: weekly picks, one winner. Up to $100 at $1 per valid accepted entry. Free to play for Texas residents 18+. Presented by Gilder Storage.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function PickemOpenGraphImage() {
  const [varsityvueLogo, gilderLogo] = await Promise.all([
    readFile(join(process.cwd(), "public/logos/varsityvue-logo.png"), "base64"),
    readFile(join(process.cwd(), "public/sponsors/gilder-storage-approved.png"), "base64"),
  ]);

  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", height: "100%", padding: "44px 64px", color: "#ffffff", background: "linear-gradient(135deg, #08090c 0%, #19191d 100%)", borderTop: "12px solid #8B1020" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
        {/* Embed the approved repository assets without a remote fetch. */}
        <img src={`data:image/png;base64,${varsityvueLogo}`} width={126} height={84} alt="" style={{ objectFit: "contain" }} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 800, letterSpacing: "-1px" }}><span>Varsity</span><span style={{ color: "#B2192F" }}>Vue</span></div>
          <div style={{ display: "flex", marginTop: 6, fontSize: 17, letterSpacing: "3px", color: "#c9c9cc" }}>TEXAS HIGH SCHOOL FOOTBALL</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 36 }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 108, fontWeight: 900, letterSpacing: "-5px", lineHeight: 1 }}>PICK ’EM</div>
          <div style={{ display: "flex", marginTop: 22, fontSize: 25, fontWeight: 700, letterSpacing: "1px", color: "#dedee1" }}>WEEKLY PICKS. ONE WINNER.</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: 380, paddingLeft: 32, borderLeft: "3px solid #8B1020" }}>
          <div style={{ display: "flex", fontSize: 53, fontWeight: 800, letterSpacing: "-2px" }}>UP TO $100</div>
          <div style={{ display: "flex", marginTop: 12, fontSize: 25, lineHeight: 1.35, color: "#dedee1" }}>$1 per valid accepted entry</div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #39393d", paddingTop: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", fontSize: 26, fontWeight: 800 }}>FREE TO PLAY · TEXAS 18+</div>
          <div style={{ display: "flex", fontSize: 23, color: "#c9c9cc" }}>VarsityVue.com/pickem</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", fontSize: 22, color: "#dedee1" }}>Presented by</div>
          <img src={`data:image/png;base64,${gilderLogo}`} width={176} height={132} alt="Gilder Storage" style={{ objectFit: "contain" }} />
        </div>
      </div>
    </div>,
    size,
  );
}

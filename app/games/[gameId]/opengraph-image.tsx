import { ImageResponse } from "next/og";

import { getDynamicGameById } from "@/lib/dynamic-games";
import { getSchoolBySlug } from "@/lib/schools";

const EMBEDDED_LOGOS: Record<string, string> = {
  "de-leon": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALQAAACzCAMAAAAXFsa4AAAAwFBMVEWynZ1Z
Hh2VY2NpV1aje4Obg3vLoKU2IyJpQT3b6uVXO0Hku8WBNTjjwryEPUR0gW+A
RD/7/PwAAABLAgM2AQH////z6OhMFhfo19bNtrVUJihwR0mOaGlpNzjVxsaw
lpaqiImTdnV2VVXHqKq4p6ZWNTRmKSyGV1j+/v7kysv////////a1NGYhoXr
49yld3g3FRX///////9THCP///6GSU7Rw7xvPELv3OEZAAB5ZmZjBAm6s6/D
mJnTvcKMXGKD+oNkAAAAQHRSTlP///////////////////////4A//8E////
////////////////////0P8uT///////sY//bv//////////////pa861AAA
JoVJREFUeNrNXQl34ziOluMc1dfsOqJFHdQt2XF8Jo4TO+f//1cLgIcoWU7S
XTUzq/e6q5KyJQjE+QEgneufvMbjsfzL7e3tfD6/VRf8dX5/d3cjr7u7h/nt
uP35n7icnyWZ6AX6bkZfXTd3D7dE+U/T7fwsxePb+6/ptSi/n4/Ny/7nicbn
juefUuwnSRC8VkGy8OxfE90/Q7bzMyQ3FHuL93QpxIcQ+XkGV/6xe4omrrkG
kVhWC4vu258h2+nq1LcEDj9ze28ozoqQM7hc1r5c64IfeZQvE/2lu58g2+no
1LGCj9V1guRkGYc2edz95ALC44vEJvt79qlDgGMT8gBGClT8Wt/M/uy4ueCT
d4rHadTmp+u2uXzMcsbCeOkbIRnr5T19HfPSMTTP74yGz/Vt1GfBUtks0Vz2
spDZxLqDSfyv3fRsra4zAVK+i+CKlfjoz4ZCsXv+DdM9BmbeP0hjaRMN37q3
9RtXTn4ezANqG/iH+4c5vYh+uUUuSX6Ryx6ty0XbSNiX57875yIKOVekcxGo
JxnOzB/mdN3abJ4/aG0HM6+pdlo0e0miV448WteeoXdTJE85awS1SP0OkfK/
JOhSv09FLQkfXPiKGBTKm+5j7sidtr98N5ZUS6IlzUERAgt+VF+7iIXgRmh5
lLUpTp3RUt0j3fijZXDE9Sx28et19V2X5KklvJGS5BDNc/xNJleOsSixP794
TZdL59UyskmuSEaKuzxejaJoVAv4oqhGCfOTQ2We2dw0KPBhXCy+Q/BFEYaR
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
191zlX/F9X9QZ0XJ6Tjr7AAAAABJRU5ErkJggg==
",
  "goldthwaite": "data:image/png;base64,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
9qE3hLlsdAAAAABJRU5ErkJggg==
",
};

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";

function formatKickoff(kickoff?: string) {
  if (!kickoff?.includes("T")) return "TIME TBD";
  const parsed = new Date(kickoff);
  if (Number.isNaN(parsed.getTime())) return "TIME TBD";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    timeZone: "America/Chicago",
  }).format(parsed).toUpperCase();
}

export default async function GameOpenGraphImage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const game = await getDynamicGameById(gameId);
  const away = game?.awayTeam ?? "Away";
  const home = game?.homeTeam ?? "Home";
  const awaySchool = getSchoolBySlug(game?.awaySchoolSlug ?? "");
  const homeSchool = getSchoolBySlug(game?.homeSchoolSlug ?? "");
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://varsityvue.com";
  const awayLogo = game?.awaySchoolSlug ? (EMBEDDED_LOGOS[game.awaySchoolSlug] ?? `${origin}/logos/schools/${game.awaySchoolSlug}.png`) : null;
  const homeLogo = game?.homeSchoolSlug ? (EMBEDDED_LOGOS[game.homeSchoolSlug] ?? `${origin}/logos/schools/${game.homeSchoolSlug}.png`) : null;
  const awayColor = awaySchool?.colors.primary ?? "#8B1020";
  const homeColor = homeSchool?.colors.primary ?? "#8B1020";
  const feature = game?.featured ? "GAME OF THE WEEK" : game?.status === "live" ? "LIVE GAME CENTER" : game?.status === "final" ? "FINAL" : "MATCHUP CENTER";

  return new ImageResponse(
    <div style={{ width:"100%", height:"100%", display:"flex", flexDirection:"column", position:"relative", overflow:"hidden", background:"#050505", color:"#fff", padding:"46px 58px", borderTop:"10px solid #8B1020", fontFamily:"Arial, sans-serif" }}>
      <div style={{ position:"absolute", inset:0, display:"flex", background:`radial-gradient(circle at 15% 45%, ${awayColor}44 0%, transparent 35%), radial-gradient(circle at 85% 45%, ${homeColor}44 0%, transparent 35%), linear-gradient(135deg,#090909 0%,#020202 55%,#090909 100%)` }} />
      <div style={{ position:"absolute", left:0, right:0, bottom:0, height:"5px", display:"flex", background:`linear-gradient(90deg,${awayColor} 0%,${awayColor} 48%,#8B1020 48%,#8B1020 52%,${homeColor} 52%,${homeColor} 100%)` }} />
      <div style={{ position:"relative", width:"100%", height:"100%", display:"flex", flexDirection:"column" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"18px" }}>
          <img src={`${origin}/logos/varsityvue-logo.png`} width="58" height="58" style={{ objectFit:"contain" }} />
          <div style={{ display:"flex", fontSize:"32px", fontWeight:900, letterSpacing:"-1px" }}>VARSITY<span style={{color:"#8B1020"}}>VUE</span></div>
        </div>
        <div style={{ display:"flex", color:"#C8102E", fontSize:"20px", fontWeight:900, letterSpacing:"3px" }}>{feature}</div>
      </div>

      <div style={{ display:"flex", flex:1, alignItems:"center", marginTop:"18px" }}>
        <div style={{ display:"flex", flex:1, flexDirection:"column", alignItems:"center", justifyContent:"center", borderRight:"1px solid rgba(255,255,255,.12)", padding:"20px 42px" }}>
          <div style={{ display:"flex", width:"72%", height:"5px", background:awayColor, marginBottom:"18px" }} />
          {awayLogo ? <div style={{ display:"flex", width:"126px", height:"126px", alignItems:"center", justifyContent:"center", borderRadius:"28px", background:"rgba(0,0,0,.34)", border:"1px solid rgba(255,255,255,.10)", marginBottom:"16px" }}><img src={awayLogo} width="106" height="106" style={{ objectFit:"contain" }} /></div> : null}
          <div style={{ display:"flex", fontSize:"48px", lineHeight:1, fontWeight:900, textAlign:"center" }}>{away}</div>
          {awaySchool?.mascot ? <div style={{ display:"flex", marginTop:"10px", fontSize:"19px", fontWeight:800, letterSpacing:"3px", color:"rgba(255,255,255,.5)" }}>{awaySchool.mascot.toUpperCase()}</div> : null}
        </div>

        <div style={{ display:"flex", width:"120px", alignItems:"center", justifyContent:"center", fontSize:"28px", fontWeight:900, color:"rgba(255,255,255,.35)" }}>AT</div>

        <div style={{ display:"flex", flex:1, flexDirection:"column", alignItems:"center", justifyContent:"center", borderLeft:"1px solid rgba(255,255,255,.12)", padding:"20px 42px" }}>
          <div style={{ display:"flex", width:"72%", height:"5px", background:homeColor, marginBottom:"18px" }} />
          {homeLogo ? <div style={{ display:"flex", width:"126px", height:"126px", alignItems:"center", justifyContent:"center", borderRadius:"28px", background:"rgba(0,0,0,.34)", border:"1px solid rgba(255,255,255,.10)", marginBottom:"16px" }}><img src={homeLogo} width="106" height="106" style={{ objectFit:"contain" }} /></div> : null}
          <div style={{ display:"flex", fontSize:"48px", lineHeight:1, fontWeight:900, textAlign:"center" }}>{home}</div>
          {homeSchool?.mascot ? <div style={{ display:"flex", marginTop:"10px", fontSize:"19px", fontWeight:800, letterSpacing:"3px", color:"rgba(255,255,255,.5)" }}>{homeSchool.mascot.toUpperCase()}</div> : null}
        </div>
      </div>

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", borderTop:"1px solid rgba(255,255,255,.12)", paddingTop:"22px" }}>
        <div style={{ display:"flex", fontSize:"22px", fontWeight:900 }}>{formatKickoff(game?.kickoff)}</div>
        <div style={{ display:"flex", fontSize:"18px", fontWeight:800, letterSpacing:"2px", color:"rgba(255,255,255,.5)" }}>GAME CENTER · LISTEN LIVE · SCORES</div>
      </div>
      </div>
    </div>,
    size,
  );
}

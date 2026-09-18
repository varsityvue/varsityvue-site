import { ImageResponse } from "next/og";

import { getDynamicGameById } from "@/lib/dynamic-games";
import { getSchoolBySlug } from "@/lib/schools";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
   const awayColor = awaySchool?.colors.primary ?? "#8B1020";
  const homeColor = homeSchool?.colors.primary ?? "#8B1020";
  const feature = game?.featured ? "GAME OF THE WEEK" : game?.status === "live" ? "LIVE GAME CENTER" : game?.status === "final" ? "FINAL" : "MATCHUP CENTER";

  return new ImageResponse(
    <div style={{ width:"100%", height:"100%", display:"flex", position:"relative", overflow:"hidden", background:"#070708", color:"#fff", fontFamily:"Arial, sans-serif" }}>
      <div style={{ position:"absolute", inset:0, display:"flex", background:`linear-gradient(112deg,${awayColor}38 0%,transparent 38%,transparent 62%,${homeColor}38 100%)` }} />
      <div style={{ position:"absolute", top:"-170px", left:"-90px", width:"520px", height:"520px", borderRadius:"260px", display:"flex", background:awayColor, opacity:.12 }} />
      <div style={{ position:"absolute", bottom:"-210px", right:"-100px", width:"580px", height:"580px", borderRadius:"290px", display:"flex", background:homeColor, opacity:.12 }} />
      <div style={{ position:"absolute", top:0, left:0, width:"50%", height:"9px", display:"flex", background:awayColor }} />
      <div style={{ position:"absolute", top:0, right:0, width:"50%", height:"9px", display:"flex", background:homeColor }} />

      <div style={{ position:"relative", width:"100%", height:"100%", padding:"42px 58px", display:"flex", flexDirection:"column" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", fontSize:"31px", fontWeight:900, letterSpacing:"-1px" }}>VARSITY<span style={{color:"#B31B34"}}>VUE</span></div>
          <div style={{ display:"flex", alignItems:"center", gap:"12px", padding:"10px 16px", border:"1px solid rgba(255,255,255,.14)", borderRadius:"999px", background:"rgba(0,0,0,.28)", fontSize:"14px", fontWeight:900, letterSpacing:"2.5px" }}>
            <span style={{color:"#B31B34"}}>●</span>{feature}
          </div>
        </div>

        <div style={{ display:"flex", marginTop:"34px", fontSize:"13px", fontWeight:900, letterSpacing:"4px", color:"rgba(255,255,255,.42)" }}>FRIDAY NIGHT · WEEK {game?.week ?? "—"}</div>

        <div style={{ display:"flex", flex:1, flexDirection:"column", justifyContent:"center" }}>
          <div style={{ display:"flex", alignItems:"flex-end", gap:"22px" }}>
            <div style={{ display:"flex", fontSize:away.length > 11 ? "72px" : "84px", lineHeight:.9, fontWeight:900, letterSpacing:"-4px", textTransform:"uppercase" }}>{away}</div>
            <div style={{ display:"flex", paddingBottom:"8px", fontSize:"20px", fontWeight:900, letterSpacing:"3px", color:"rgba(255,255,255,.35)" }}>AT</div>
          </div>
          <div style={{ display:"flex", marginTop:"15px", fontSize:home.length > 11 ? "72px" : "84px", lineHeight:.9, fontWeight:900, letterSpacing:"-4px", textTransform:"uppercase" }}>{home}</div>

          <div style={{ display:"flex", alignItems:"center", gap:"14px", marginTop:"27px" }}>
            <div style={{ display:"flex", width:"62px", height:"5px", background:awayColor }} />
            <div style={{ display:"flex", fontSize:"15px", fontWeight:900, letterSpacing:"3px", color:"rgba(255,255,255,.62)" }}>{awaySchool?.mascot?.toUpperCase() ?? "AWAY"}</div>
            <div style={{ display:"flex", fontSize:"14px", color:"rgba(255,255,255,.20)" }}>×</div>
            <div style={{ display:"flex", fontSize:"15px", fontWeight:900, letterSpacing:"3px", color:"rgba(255,255,255,.62)" }}>{homeSchool?.mascot?.toUpperCase() ?? "HOME"}</div>
            <div style={{ display:"flex", width:"62px", height:"5px", background:homeColor }} />
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"stretch", borderTop:"1px solid rgba(255,255,255,.14)", paddingTop:"20px" }}>
          <div style={{ display:"flex", flexDirection:"column", width:"42%" }}>
            <div style={{ display:"flex", fontSize:"11px", fontWeight:900, letterSpacing:"3px", color:"rgba(255,255,255,.35)" }}>KICKOFF</div>
            <div style={{ display:"flex", marginTop:"5px", fontSize:"25px", fontWeight:900 }}>{formatKickoff(game?.kickoff)}</div>
          </div>
          <div style={{ display:"flex", flex:1, alignItems:"center", justifyContent:"flex-end", gap:"10px", fontSize:"14px", fontWeight:900, letterSpacing:"1.8px", color:"rgba(255,255,255,.62)" }}>
            <span>GAME CENTER</span><span style={{color:"#B31B34"}}>•</span><span>LISTEN LIVE</span><span style={{color:"#B31B34"}}>•</span><span>SCORES</span>
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}

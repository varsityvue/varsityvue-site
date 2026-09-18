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
    <div style={{ width:"100%", height:"100%", display:"flex", position:"relative", overflow:"hidden", background:"#050505", color:"#fff", fontFamily:"Arial, sans-serif" }}>
      <div style={{ position:"absolute", inset:0, display:"flex", background:`radial-gradient(circle at 8% 54%, ${awayColor}55 0%, transparent 34%), radial-gradient(circle at 92% 54%, ${homeColor}55 0%, transparent 34%), linear-gradient(120deg,#0b0b0d 0%,#030303 48%,#090909 100%)` }} />
      <div style={{ position:"absolute", top:0, left:0, width:"50%", height:"8px", display:"flex", background:awayColor }} />
      <div style={{ position:"absolute", top:0, right:0, width:"50%", height:"8px", display:"flex", background:homeColor }} />

      <div style={{ position:"relative", width:"100%", height:"100%", padding:"46px 62px 42px", display:"flex", flexDirection:"column" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid rgba(255,255,255,.10)", paddingBottom:"24px" }}>
          <div style={{ display:"flex", alignItems:"baseline", gap:"13px" }}>
            <div style={{ display:"flex", fontSize:"30px", fontWeight:900, letterSpacing:"-1px" }}>VARSITY<span style={{color:"#B31B34"}}>VUE</span></div>
            <div style={{ display:"flex", fontSize:"13px", fontWeight:800, letterSpacing:"3px", color:"rgba(255,255,255,.38)" }}>TEXAS HS FOOTBALL</div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
            <div style={{ display:"flex", width:"28px", height:"3px", background:"#B31B34" }} />
            <div style={{ display:"flex", color:"#fff", fontSize:"16px", fontWeight:900, letterSpacing:"3px" }}>{feature}</div>
          </div>
        </div>

        <div style={{ display:"flex", flex:1, alignItems:"stretch", padding:"34px 0 28px" }}>
          <div style={{ display:"flex", flex:1, flexDirection:"column", justifyContent:"center", paddingRight:"40px" }}>
            <div style={{ display:"flex", fontSize:"14px", fontWeight:900, letterSpacing:"4px", color:awayColor }}>AWAY · {awaySchool?.mascot?.toUpperCase() ?? "TEAM"}</div>
            <div style={{ display:"flex", marginTop:"14px", fontSize:away.length > 12 ? "58px" : "70px", lineHeight:.92, fontWeight:900, letterSpacing:"-3px", textTransform:"uppercase" }}>{away}</div>
            <div style={{ display:"flex", width:"170px", height:"6px", marginTop:"24px", background:awayColor }} />
          </div>

          <div style={{ display:"flex", width:"110px", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
            <div style={{ display:"flex", width:"1px", height:"72px", background:"rgba(255,255,255,.14)" }} />
            <div style={{ display:"flex", margin:"15px 0", fontSize:"22px", fontWeight:900, letterSpacing:"3px", color:"rgba(255,255,255,.55)" }}>AT</div>
            <div style={{ display:"flex", width:"1px", height:"72px", background:"rgba(255,255,255,.14)" }} />
          </div>

          <div style={{ display:"flex", flex:1, flexDirection:"column", justifyContent:"center", alignItems:"flex-end", paddingLeft:"40px", textAlign:"right" }}>
            <div style={{ display:"flex", fontSize:"14px", fontWeight:900, letterSpacing:"4px", color:homeColor }}>HOME · {homeSchool?.mascot?.toUpperCase() ?? "TEAM"}</div>
            <div style={{ display:"flex", marginTop:"14px", fontSize:home.length > 12 ? "58px" : "70px", lineHeight:.92, fontWeight:900, letterSpacing:"-3px", textTransform:"uppercase" }}>{home}</div>
            <div style={{ display:"flex", width:"170px", height:"6px", marginTop:"24px", background:homeColor }} />
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", borderTop:"1px solid rgba(255,255,255,.12)", paddingTop:"23px" }}>
          <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
            <div style={{ display:"flex", fontSize:"11px", fontWeight:900, letterSpacing:"3px", color:"rgba(255,255,255,.35)" }}>KICKOFF</div>
            <div style={{ display:"flex", fontSize:"24px", fontWeight:900, letterSpacing:"-.5px" }}>{formatKickoff(game?.kickoff)}</div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"13px", fontSize:"15px", fontWeight:900, letterSpacing:"2px", color:"rgba(255,255,255,.58)" }}>
            <span>GAME CENTER</span><span style={{color:"#B31B34"}}>•</span><span>LISTEN LIVE</span><span style={{color:"#B31B34"}}>•</span><span>SCORES</span>
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}

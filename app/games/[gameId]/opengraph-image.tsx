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
    <div style={{ width:"100%", height:"100%", display:"flex", position:"relative", overflow:"hidden", background:"#050506", color:"#fff", fontFamily:"Arial, sans-serif" }}>
      <div style={{ position:"absolute", inset:0, display:"flex", background:`linear-gradient(118deg,${awayColor}2b 0%,transparent 34%,transparent 66%,${homeColor}2b 100%)` }} />
      <div style={{ position:"absolute", top:0, left:0, width:"50%", height:"9px", display:"flex", background:awayColor }} />
      <div style={{ position:"absolute", top:0, right:0, width:"50%", height:"9px", display:"flex", background:homeColor }} />
 
      <div style={{ position:"relative", width:"100%", height:"100%", padding:"40px 74px 38px", display:"flex", flexDirection:"column" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", flexDirection:"column" }}>
            <div style={{ display:"flex", fontSize:"29px", fontWeight:900, letterSpacing:"-1px" }}>VARSITY<span style={{color:"#B31B34"}}>VUE</span></div>
            <div style={{ display:"flex", marginTop:"5px", fontSize:"10px", fontWeight:800, letterSpacing:"4px", color:"rgba(255,255,255,.36)" }}>TEXAS HIGH SCHOOL FOOTBALL</div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"11px", padding:"10px 17px", border:"1px solid rgba(255,255,255,.16)", borderRadius:"999px", background:"rgba(0,0,0,.34)", fontSize:"13px", fontWeight:900, letterSpacing:"2.6px" }}>
            <span style={{color:"#C8102E"}}>●</span>{feature}
          </div>
        </div>

        <div style={{ display:"flex", marginTop:"34px", fontSize:"12px", fontWeight:900, letterSpacing:"4px", color:"rgba(255,255,255,.42)" }}>FRIDAY NIGHT · WEEK {game?.week ?? "—"}</div>

        <div style={{ display:"flex", flex:1, flexDirection:"column", justifyContent:"center", padding:"0 24px" }}>
          <div style={{ display:"flex", alignItems:"center", width:"100%" }}>
            <div style={{ display:"flex", flex:1, alignItems:"center" }}>
              <div style={{ display:"flex", fontSize:away.length > 11 ? "78px" : "90px", lineHeight:.88, fontWeight:900, letterSpacing:"-4px", textTransform:"uppercase", textShadow:`0 0 34px ${awayColor}66` }}>{away}</div>
            </div>
            <div style={{ display:"flex", width:"54px", marginLeft:"-6px", flexDirection:"column", alignItems:"center", gap:"6px" }}>
              <div style={{ display:"flex", width:"30px", height:"2px", background:"rgba(255,255,255,.26)" }} />
              <div style={{ display:"flex", fontSize:"21px", fontWeight:900, color:"rgba(255,255,255,.55)" }}>AT</div>
              <div style={{ display:"flex", width:"30px", height:"2px", background:"rgba(255,255,255,.26)" }} />
            </div>
          </div>
          <div style={{ display:"flex", marginTop:"13px", fontSize:home.length > 11 ? "78px" : "90px", lineHeight:.88, fontWeight:900, letterSpacing:"-4px", textTransform:"uppercase", textShadow:`0 0 34px ${homeColor}66` }}>{home}</div>

          <div style={{ display:"flex", alignItems:"center", gap:"16px", marginTop:"25px" }}>
            <div style={{ display:"flex", width:"96px", height:"5px", background:awayColor }} />
            <div style={{ display:"flex", fontSize:"14px", fontWeight:900, letterSpacing:"4px", color:"rgba(255,255,255,.68)" }}>{awaySchool?.mascot?.toUpperCase() ?? "AWAY"}</div>
            <div style={{ display:"flex", fontSize:"12px", color:"rgba(255,255,255,.22)" }}>×</div>
            <div style={{ display:"flex", fontSize:"14px", fontWeight:900, letterSpacing:"4px", color:"rgba(255,255,255,.68)" }}>{homeSchool?.mascot?.toUpperCase() ?? "HOME"}</div>
            <div style={{ display:"flex", width:"96px", height:"5px", background:homeColor }} />
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"stretch", borderTop:"1px solid rgba(255,255,255,.16)", paddingTop:"19px" }}>
          <div style={{ display:"flex", flexDirection:"column", width:"46%" }}>
            <div style={{ display:"flex", fontSize:"10px", fontWeight:900, letterSpacing:"3.5px", color:"rgba(255,255,255,.35)" }}>KICKOFF</div>
            <div style={{ display:"flex", marginTop:"5px", fontSize:"25px", fontWeight:900 }}>{formatKickoff(game?.kickoff)}</div>
          </div>
          <div style={{ display:"flex", flex:1, alignItems:"center", justifyContent:"flex-end", gap:"11px", fontSize:"14px", fontWeight:900, letterSpacing:"2px", color:"rgba(255,255,255,.66)" }}>
            <span>GAME CENTER</span><span style={{color:"#C8102E"}}>•</span><span>LISTEN LIVE</span><span style={{color:"#C8102E"}}>•</span><span>SCORES</span>
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}

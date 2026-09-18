import { ImageResponse } from "next/og";

import { getDynamicGameById } from "@/lib/dynamic-games";
import { getSchoolBySlug } from "@/lib/schools";

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
  const awayColor = awaySchool?.colors.primary ?? "#8B1020";
  const homeColor = homeSchool?.colors.primary ?? "#8B1020";
  const feature = game?.featured ? "GAME OF THE WEEK" : game?.status === "live" ? "LIVE GAME CENTER" : game?.status === "final" ? "FINAL" : "MATCHUP CENTER";

  return new ImageResponse(
    <div style={{ width:"100%", height:"100%", display:"flex", flexDirection:"column", background:"#050505", color:"#fff", padding:"52px 64px", borderTop:"14px solid #8B1020", fontFamily:"Arial, sans-serif" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"18px" }}>
          <img src="https://varsityvue.com/logos/varsityvue-logo.png" width="68" height="68" style={{ objectFit:"contain" }} />
          <div style={{ display:"flex", fontSize:"34px", fontWeight:900 }}>VARSITY<span style={{color:"#8B1020"}}>VUE</span></div>
        </div>
        <div style={{ display:"flex", color:"#C8102E", fontSize:"20px", fontWeight:900, letterSpacing:"3px" }}>{feature}</div>
      </div>

      <div style={{ display:"flex", flex:1, alignItems:"center", marginTop:"28px" }}>
        <div style={{ display:"flex", flex:1, flexDirection:"column", alignItems:"center", justifyContent:"center", borderRight:"1px solid rgba(255,255,255,.12)", padding:"20px 42px" }}>
          <div style={{ display:"flex", width:"100%", height:"8px", background:awayColor, marginBottom:"24px" }} />
          {awaySchool ? <img src={`https://varsityvue.com/logos/schools/${awaySchool.slug}.png`} width="105" height="105" style={{ objectFit:"contain", marginBottom:"18px" }} /> : null}
          <div style={{ display:"flex", fontSize:"48px", lineHeight:1, fontWeight:900, textAlign:"center" }}>{away}</div>
          {awaySchool?.mascot ? <div style={{ display:"flex", marginTop:"10px", fontSize:"19px", fontWeight:800, letterSpacing:"3px", color:"rgba(255,255,255,.5)" }}>{awaySchool.mascot.toUpperCase()}</div> : null}
        </div>

        <div style={{ display:"flex", width:"120px", alignItems:"center", justifyContent:"center", fontSize:"28px", fontWeight:900, color:"rgba(255,255,255,.35)" }}>AT</div>

        <div style={{ display:"flex", flex:1, flexDirection:"column", alignItems:"center", justifyContent:"center", borderLeft:"1px solid rgba(255,255,255,.12)", padding:"20px 42px" }}>
          <div style={{ display:"flex", width:"100%", height:"8px", background:homeColor, marginBottom:"24px" }} />
          {homeSchool ? <img src={`https://varsityvue.com/logos/schools/${homeSchool.slug}.png`} width="105" height="105" style={{ objectFit:"contain", marginBottom:"18px" }} /> : null}
          <div style={{ display:"flex", fontSize:"48px", lineHeight:1, fontWeight:900, textAlign:"center" }}>{home}</div>
          {homeSchool?.mascot ? <div style={{ display:"flex", marginTop:"10px", fontSize:"19px", fontWeight:800, letterSpacing:"3px", color:"rgba(255,255,255,.5)" }}>{homeSchool.mascot.toUpperCase()}</div> : null}
        </div>
      </div>

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", borderTop:"1px solid rgba(255,255,255,.12)", paddingTop:"22px" }}>
        <div style={{ display:"flex", fontSize:"22px", fontWeight:900 }}>{formatKickoff(game?.kickoff)}</div>
        <div style={{ display:"flex", fontSize:"18px", fontWeight:800, letterSpacing:"2px", color:"rgba(255,255,255,.5)" }}>GAME CENTER · LISTEN LIVE · SCORES</div>
      </div>
    </div>,
    size,
  );
}

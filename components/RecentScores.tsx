import Link from "next/link";

import type { Game } from "@/types/platform";
import type { SchoolTheme } from "../types/school-theme";
import { getSchoolBySlug } from "@/lib/schools";
import SchoolBadge from "./SchoolBadge";

type RecentScoresProps = {
  scores: Game[];
  theme: SchoolTheme;
  schoolSlug: string;
};

const MAX_RESULTS = 4;

function parseGameDate(kickoff?: string) {
  if (!kickoff) return null;
  if (!kickoff.includes("T")) {
    const [year, month, day] = kickoff.split("-").map(Number);
    const parsedDate = new Date(Date.UTC(year, month - 1, day, 12));
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }
  const parsedDate = new Date(kickoff);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function formatScoreDate(kickoff?: string) {
  const parsedDate = parseGameDate(kickoff);
  if (!parsedDate) return "Date TBD";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/Chicago",
  }).format(parsedDate);
}

function getResult(game: Game, schoolSlug: string) {
  if (game.status !== "final") return null;
  if (game.homeScore === undefined || game.awayScore === undefined) return null;
  const isHomeTeam = game.homeSchoolSlug === schoolSlug;
  const schoolScore = isHomeTeam ? game.homeScore : game.awayScore;
  const opponentScore = isHomeTeam ? game.awayScore : game.homeScore;
  if (schoolScore === opponentScore) return "T";
  return schoolScore > opponentScore ? "W" : "L";
}

function getScoreDisplay(game: Game, schoolSlug: string) {
  if (game.homeScore === undefined || game.awayScore === undefined) return "—";
  const isHomeTeam = game.homeSchoolSlug === schoolSlug;
  const schoolScore = isHomeTeam ? game.homeScore : game.awayScore;
  const opponentScore = isHomeTeam ? game.awayScore : game.homeScore;
  return `${schoolScore}-${opponentScore}`;
}

function getOpponentSlug(game: Game, schoolSlug: string) {
  const isHomeTeam = game.homeSchoolSlug === schoolSlug;
  return isHomeTeam ? game.awaySchoolSlug : game.homeSchoolSlug;
}

function getOpponent(game: Game, schoolSlug: string) {
  const isHomeTeam = game.homeSchoolSlug === schoolSlug;
  return {
    name: isHomeTeam ? game.awayTeam ?? "Opponent" : game.homeTeam ?? "Opponent",
    location: game.isNeutralSite ? "Neutral" : isHomeTeam ? "Home" : "Away",
    prefix: game.isNeutralSite ? "vs" : isHomeTeam ? "vs" : "at",
  };
}

function getResultClass(result: "W" | "L" | "T" | null) {
  if (result === "W") return "border-green-400/30 bg-green-500/15 text-green-300";
  if (result === "L") return "border-red-400/30 bg-red-500/15 text-red-300";
  if (result === "T") return "border-yellow-400/30 bg-yellow-500/15 text-yellow-200";
  return "border-white/10 bg-white/10 text-white/60";
}

export default function RecentScores({ scores, theme, schoolSlug }: RecentScoresProps) {
  const visibleScores = scores.slice(0, MAX_RESULTS);
  const [latest, ...previous] = visibleScores;

  return (
    <section
      className="overflow-hidden rounded-[1.5rem] border bg-white/[0.045] shadow-2xl sm:rounded-[1.75rem]"
      style={{ borderColor: `${theme.secondary}22`, boxShadow: `0 18px 55px ${theme.primary}14` }}
    >
      <div className="flex items-end justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/40 sm:text-xs sm:tracking-[0.24em]">Recent Results</p>
          <h2 className="mt-1.5 text-2xl font-black text-white sm:mt-2 sm:text-3xl">Latest scores</h2>
          <p className="mt-2 hidden text-sm text-white/45 sm:block">Verified VarsityVue finals for this program.</p>
        </div>
        <Link href={`/schools/${schoolSlug}/schedule`} className="shrink-0 text-[10px] font-black uppercase tracking-[0.12em] text-white/50 transition hover:text-white sm:text-xs sm:tracking-[0.16em]">Schedule →</Link>
      </div>

      {!latest ? (
        <div className="p-4 sm:p-6">
          <div className="rounded-2xl border bg-black/35 p-5 sm:rounded-3xl sm:p-6" style={{ borderColor: `${theme.secondary}33` }}>
            <p className="text-base font-black text-white sm:text-lg">No final scores available yet.</p>
            <p className="mt-2 text-sm leading-6 text-white/50">Results will appear here after verified finals are added.</p>
          </div>
        </div>
      ) : (
        <div className="p-4 sm:p-6">
          <FeaturedResult game={latest} schoolSlug={schoolSlug} theme={theme} />
          {previous.length > 0 && (
            <div className="mt-3 grid gap-2.5 sm:mt-4 sm:grid-cols-3 sm:gap-3">
              {previous.map((game) => (
                <CompactResult key={game.id} game={game} schoolSlug={schoolSlug} theme={theme} />
              ))}
            </div>
          )}
        </div>
      )}

      {scores.length > MAX_RESULTS && (
        <p className="px-4 pb-4 text-[10px] text-white/30 sm:px-6 sm:pb-5 sm:text-xs">Showing the {MAX_RESULTS} most recent finals.</p>
      )}
    </section>
  );
}

function FeaturedResult({ game, schoolSlug, theme }: { game: Game; schoolSlug: string; theme: SchoolTheme }) {
  const result = getResult(game, schoolSlug);
  const opponentSlug = getOpponentSlug(game, schoolSlug);
  const opponentSchool = opponentSlug ? getSchoolBySlug(opponentSlug) : undefined;
  const opponent = getOpponent(game, schoolSlug);

  return (
    <Link
      href={`/games/${game.id}`}
      className="group relative block overflow-hidden rounded-[1.25rem] border bg-black/40 p-4 transition hover:bg-white/[0.06] sm:rounded-[1.5rem] sm:p-6"
      style={{ borderColor: `${theme.secondary}30` }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-30" style={{ background: `radial-gradient(circle at 100% 0%, ${theme.primary}, transparent 54%)` }} />
      <div className="relative grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black sm:px-3 sm:py-1.5 sm:text-xs ${getResultClass(result)}`}>{result ?? "FINAL"}</span>
            <span className="text-[9px] font-black uppercase tracking-[0.14em] text-white/30 sm:text-[10px] sm:tracking-[0.18em]">Latest</span>
            <span className="text-[10px] font-bold text-white/35 sm:text-xs">{formatScoreDate(game.kickoff)}</span>
          </div>
          <div className="mt-3.5 flex items-center gap-3 sm:mt-5 sm:gap-4">
            {opponentSchool ? <SchoolBadge school={opponentSchool} size="xs" /> : <FallbackBadge label={opponent.name} />}
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/30 sm:text-[10px] sm:tracking-[0.16em]">{opponent.location}{game.districtGame ? " · District" : ""}</p>
              <h3 className="mt-1 break-words text-lg font-black leading-tight text-white sm:text-2xl">{opponent.prefix} {opponent.name}</h3>
              <p className="mt-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-white/35 group-hover:text-white/70 sm:mt-2 sm:text-xs sm:tracking-[0.12em]">Game Center →</p>
            </div>
          </div>
        </div>
        <div className="flex items-end justify-between gap-3 border-t border-white/10 pt-3 sm:block sm:border-l sm:border-t-0 sm:pl-7 sm:pt-0 sm:text-right">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/25 sm:text-[10px] sm:tracking-[0.18em]">Final</p>
            <p className="mt-0.5 text-4xl font-black tracking-[-0.05em] text-white sm:mt-1 sm:text-6xl">{getScoreDisplay(game, schoolSlug)}</p>
          </div>
          {game.articleIds?.length ? <div className="pb-1 sm:mt-3 sm:pb-0"><ResultBadge label="Recap" /></div> : null}
        </div>
      </div>
    </Link>
  );
}

function CompactResult({ game, schoolSlug, theme }: { game: Game; schoolSlug: string; theme: SchoolTheme }) {
  const result = getResult(game, schoolSlug);
  const opponent = getOpponent(game, schoolSlug);
  return (
    <Link href={`/games/${game.id}`} className="rounded-xl border bg-black/30 p-3.5 transition hover:bg-white/[0.05] sm:rounded-2xl sm:p-4" style={{ borderColor: `${theme.secondary}25` }}>
      <div className="flex items-center justify-between gap-2">
        <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black sm:text-[10px] ${getResultClass(result)}`}>{result ?? "FINAL"}</span>
        <span className="text-[9px] font-bold text-white/30 sm:text-[10px]">{formatScoreDate(game.kickoff)}</span>
      </div>
      <div className="mt-2.5 flex items-end justify-between gap-3 sm:block sm:mt-3">
        <p className="min-w-0 break-words text-sm font-black leading-tight text-white">{opponent.prefix} {opponent.name}</p>
        <p className="shrink-0 text-2xl font-black tracking-tight text-white sm:mt-2">{getScoreDisplay(game, schoolSlug)}</p>
      </div>
    </Link>
  );
}

function ResultBadge({ label }: { label: string }) {
  return <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-white/55 sm:px-3 sm:text-[10px] sm:tracking-[0.12em]">{label}</span>;
}

function FallbackBadge({ label }: { label: string }) {
  return <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/10 p-2 text-center text-[9px] font-black uppercase text-white sm:h-14 sm:w-14 sm:rounded-2xl sm:text-[10px]">{label.trim().slice(0, 3)}</div>;
}

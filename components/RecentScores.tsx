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
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 px-4 py-5 sm:px-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/45 sm:text-xs">Recent Results</p>
          <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Latest from the field</h2>
          <p className="mt-2 text-xs text-white/45 sm:text-sm">Verified VarsityVue finals for this program.</p>
        </div>
        <Link href={`/schools/${schoolSlug}/schedule`} className="text-xs font-black uppercase tracking-[0.16em] text-white/55 transition hover:text-white">Full Schedule →</Link>
      </div>

      {!latest ? (
        <div className="p-5 sm:p-6">
          <div className="rounded-3xl border bg-black/35 p-6" style={{ borderColor: `${theme.secondary}33` }}>
            <p className="text-lg font-black text-white">No final scores available yet.</p>
            <p className="mt-2 text-sm leading-6 text-white/50">Results will appear here after verified finals are added.</p>
          </div>
        </div>
      ) : (
        <div className="p-4 sm:p-6">
          <FeaturedResult game={latest} schoolSlug={schoolSlug} theme={theme} />
          {previous.length > 0 && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {previous.map((game) => (
                <CompactResult key={game.id} game={game} schoolSlug={schoolSlug} theme={theme} />
              ))}
            </div>
          )}
        </div>
      )}

      {scores.length > MAX_RESULTS && (
        <p className="px-4 pb-5 text-xs text-white/35 sm:px-6">Showing the {MAX_RESULTS} most recent finals.</p>
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
      className="group relative block overflow-hidden rounded-[1.5rem] border bg-black/40 p-5 transition hover:bg-white/[0.06] sm:p-6"
      style={{ borderColor: `${theme.secondary}30` }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-30" style={{ background: `radial-gradient(circle at 100% 0%, ${theme.primary}, transparent 54%)` }} />
      <div className="relative grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-3 py-1.5 text-xs font-black ${getResultClass(result)}`}>{result ?? "FINAL"}</span>
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Latest Result</span>
            <span className="text-xs font-bold text-white/40">{formatScoreDate(game.kickoff)}</span>
          </div>
          <div className="mt-5 flex items-center gap-4">
            {opponentSchool ? <SchoolBadge school={opponentSchool} size="xs" /> : <FallbackBadge label={opponent.name} />}
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">{opponent.location}{game.districtGame ? " · District" : ""}</p>
              <h3 className="mt-1 truncate text-xl font-black text-white sm:text-2xl">{opponent.prefix} {opponent.name}</h3>
              <p className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-white/40 group-hover:text-white/70">Open Game Center →</p>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-4 sm:border-l sm:border-t-0 sm:pl-7 sm:pt-0 sm:text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30">Final</p>
          <p className="mt-1 text-5xl font-black tracking-[-0.05em] text-white sm:text-6xl">{getScoreDisplay(game, schoolSlug)}</p>
          {game.articleIds?.length ? <div className="mt-3"><ResultBadge label="Recap Available" /></div> : null}
        </div>
      </div>
    </Link>
  );
}

function CompactResult({ game, schoolSlug, theme }: { game: Game; schoolSlug: string; theme: SchoolTheme }) {
  const result = getResult(game, schoolSlug);
  const opponent = getOpponent(game, schoolSlug);
  return (
    <Link href={`/games/${game.id}`} className="rounded-2xl border bg-black/30 p-4 transition hover:bg-white/[0.05]" style={{ borderColor: `${theme.secondary}25` }}>
      <div className="flex items-center justify-between gap-2">
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${getResultClass(result)}`}>{result ?? "FINAL"}</span>
        <span className="text-[10px] font-bold text-white/35">{formatScoreDate(game.kickoff)}</span>
      </div>
      <p className="mt-3 truncate text-sm font-black text-white">{opponent.prefix} {opponent.name}</p>
      <p className="mt-2 text-2xl font-black tracking-tight text-white">{getScoreDisplay(game, schoolSlug)}</p>
    </Link>
  );
}

function ResultBadge({ label }: { label: string }) {
  return <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/65">{label}</span>;
}

function FallbackBadge({ label }: { label: string }) {
  return <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 p-2 text-center text-[10px] font-black uppercase text-white">{label.trim().slice(0, 3)}</div>;
}

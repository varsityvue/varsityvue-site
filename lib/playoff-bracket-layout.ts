import { statewideDivisions, stateSemifinalRegionPairs } from "@/data/statewide-playoff-brackets";
import { buildRegionalRounds, verifiedWinner } from "@/lib/playoff-bracket-advancement";
import { getStateChampionshipPath } from "@/lib/state-championship-path";
import { normalizePlayoffDivision } from "@/lib/playoff-division";
import type { Game } from "@/types/platform";

export const CARD_WIDTH = 252;
export const CARD_HEIGHT = 126;
const COLUMN = 310;
const ROW = 156;
export type BracketNode = { id: string; round: number; region: number; index: number; x: number; y: number; teams: (string | null)[]; game?: Game; sources: string[] };
export function buildBracketLayout(divisionId: string, games: Game[]) {
  const division = statewideDivisions.find(d => d.id === divisionId);
  if (!division) throw new Error("Unknown playoff division");
  const nodes: BracketNode[] = [];
  division.regions.forEach((field, region) => {
    const rounds = buildRegionalRounds(field, games, 2026, divisionId, ["I", "II", "III", "IV"][region]);
    rounds.roundTeams.forEach((pairs, round) => pairs.forEach((teams, index) => {
      nodes.push({ id: `${region}-${round}-${index}`, round, region, index, teams, game: rounds.roundGames[round][index], x: (region < 2 ? round : 10-round) * COLUMN, y: (region % 2) * ROW * 8 + ((index + .5) * 2 ** round) * ROW, sources: round ? [0,1].map(i => `${region}-${round-1}-${index*2+i}`) : [] });
    }));
  });
  const path = getStateChampionshipPath(divisionId, games)!;
  const findGame = (teams: (string|null)[], round: string) => {
    if (teams.some(t => !t)) return undefined;
    const matches = games.filter(g => g.season === 2026 && g.gameType === "playoff" && normalizePlayoffDivision(g.playoff?.division) === normalizePlayoffDivision(divisionId) && g.playoff?.round === round && teams.includes(g.homeTeam ?? "") && teams.includes(g.awayTeam ?? ""));
    return matches.length === 1 ? matches[0] : undefined;
  };
  stateSemifinalRegionPairs.forEach((regions, index) => {
    const sources = regions.map(r => `${r}-3-0`);
    nodes.push({id:`semi-${index}`,round:4,region:-1,index,x:(index===0?4:6)*COLUMN,y:sources.reduce((sum,id)=>sum+nodes.find(n=>n.id===id)!.y,0)/2,teams:path.semifinals[index],game:findGame(path.semifinals[index],"State Semifinal"),sources});
  });
  nodes.push({id:"final",round:5,region:-1,index:0,x:5*COLUMN,y:ROW*8,teams:path.final,game:findGame(path.final,"State Championship"),sources:["semi-0","semi-1"]});
  return { nodes, width: 10*COLUMN+CARD_WIDTH, height: ROW*16+CARD_HEIGHT };
}
export function fitBracket(bounds: {x:number;y:number;width:number;height:number}, viewport: {width:number;height:number}, padding=24) {
  const scale = Math.min((Math.max(1,viewport.width-padding*2))/bounds.width,(Math.max(1,viewport.height-padding*2))/bounds.height,1);
  return {scale,x:(viewport.width-bounds.width*scale)/2-bounds.x*scale,y:(viewport.height-bounds.height*scale)/2-bounds.y*scale};
}
export function schoolRoute(nodes: BracketNode[], name: string) {
  const first = nodes.find(n=>n.round===0 && n.teams.includes(name));
  const route = new Set<string>();
  if (!first) return route;
  let node: BracketNode | undefined = first;
  while(node) {
    route.add(node.id);
    const winner = verifiedWinner(node.game);
    if(winner && winner!==name) break;
    const id: string = node.id;
    node=nodes.find(n=>n.sources.includes(id));
  }
  return route;
}

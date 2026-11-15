import type { BracketTemplate } from "@/lib/playoff-qualification";
import { template2AD12026 } from "@/data/playoff-template-2ad1-2026";

// All 64 seed cells independently reviewed against the UIL-linked 4A DI bracket.
// G28 places T16 Zapata above R15 Miller; preserve this official exception.
export const template4AD12026: BracketTemplate = {
 ...template2AD12026, division: "4A-D1",
 evidence: { source: "https://www.uiltexas.org/football/playoff-brackets/4AD1", reviewedBy: "VarsityVue development source review", reviewedAt: "2026-11-15T00:45:00Z" },
 slots: template2AD12026.slots.map(slot => ({ ...slot,
  id: slot.id.replace("2A-D1", "4A-D1"),
  ...(slot.region === 3 && slot.firstRoundGame === 3 ? { district: slot.side === 0 ? 16 : 15, finish: slot.side === 0 ? 3 as const : 2 as const } : {}),
 })),
};

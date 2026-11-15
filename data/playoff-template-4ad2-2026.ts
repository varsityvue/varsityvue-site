import type { BracketTemplate } from "@/lib/playoff-qualification";
import { template2AD12026 } from "@/data/playoff-template-2ad1-2026";
// All 64 cells reviewed against the UIL-linked 2026 4A DII bracket.
// Unlike 4A DI, G28 retains the ordinary R15/T16 order.
export const template4AD22026: BracketTemplate = {
 ...template2AD12026, division: "4A-D2",
 evidence: { source: "https://www.uiltexas.org/football/playoff-brackets/4AD2", reviewedBy: "VarsityVue development source review", reviewedAt: "2026-11-15T02:20:00Z" },
 slots: template2AD12026.slots.map(slot => ({ ...slot, id: slot.id.replace("2A-D1", "4A-D2") })),
};

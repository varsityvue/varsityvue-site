import type { BracketTemplate } from "@/lib/playoff-qualification";
import { template2AD12026 } from "@/data/playoff-template-2ad1-2026";

// The same slot permutation was independently checked against UIL-linked DII G1–G32.
// Reuse the reviewed mapping; participants and results remain in the canonical catalog.
export const template2AD22026: BracketTemplate = {
  ...template2AD12026,
  division: "2A-D2",
  evidence: {
    source: "https://www.uiltexas.org/football/playoff-brackets/2AD2",
    reviewedBy: "VarsityVue development source review",
    reviewedAt: "2026-11-14T21:00:00Z",
  },
  slots: template2AD12026.slots.map(slot => ({ ...slot, id: slot.id.replace("2A-D1", "2A-D2") })),
};

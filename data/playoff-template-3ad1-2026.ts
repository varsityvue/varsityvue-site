import type { BracketTemplate } from "@/lib/playoff-qualification";
import { template2AD12026 } from "@/data/playoff-template-2ad1-2026";

// Same permutation independently reviewed against all 64 UIL-linked 3A DI seed cells.
export const template3AD12026: BracketTemplate = {
  ...template2AD12026,
  division: "3A-D1",
  evidence: {
    source: "https://www.uiltexas.org/football/playoff-brackets/3AD1",
    reviewedBy: "VarsityVue development source review",
    reviewedAt: "2026-11-14T22:00:00Z",
  },
  slots: template2AD12026.slots.map(slot => ({ ...slot, id: slot.id.replace("2A-D1", "3A-D1") })),
};

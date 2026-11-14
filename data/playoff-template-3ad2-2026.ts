import type { BracketTemplate } from "@/lib/playoff-qualification";
import { template2AD12026 } from "@/data/playoff-template-2ad1-2026";

// Same permutation independently reviewed against all 64 UIL-linked 3A DII seed cells.
export const template3AD22026: BracketTemplate = {
  ...template2AD12026,
  division: "3A-D2",
  evidence: {
    source: "https://www.uiltexas.org/football/playoff-brackets/3AD2",
    reviewedBy: "VarsityVue development source review",
    reviewedAt: "2026-11-14T23:59:15.767734+00:00",
  },
  slots: template2AD12026.slots.map(slot => ({ ...slot, id: slot.id.replace("2A-D1", "3A-D2") })),
};

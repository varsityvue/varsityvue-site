import { template4AD12026 } from "@/data/playoff-template-4ad1-2026";
import { template3AD22026 } from "@/data/playoff-template-3ad2-2026";
import type { BracketTemplate } from "@/lib/playoff-qualification";
import { template2AD12026 } from "@/data/playoff-template-2ad1-2026";
import { template2AD22026 } from "@/data/playoff-template-2ad2-2026";
import { template3AD12026 } from "@/data/playoff-template-3ad1-2026";

export const reviewedPlayoffTemplates: Partial<Record<string, BracketTemplate>> = Object.fromEntries(
  [template2AD12026, template2AD22026, template3AD12026, template3AD22026, template4AD12026].map(template => [template.division, template]),
);

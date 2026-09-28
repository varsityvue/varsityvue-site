import Link from "next/link";
import type { ReactNode } from "react";

import { getArticleBySlug } from "@/lib/articles";

const articleLink = /\[([^\]\n]+)\]\(\/coverage\/([a-z0-9-]+)\)/g;

function linkedText(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(articleLink)) {
    const index = match.index ?? 0;
    if (index > lastIndex) parts.push(text.slice(lastIndex, index));

    const article = getArticleBySlug(match[2]);
    parts.push(article ? (
      <Link key={index} href={`/coverage/${article.slug}`} className="font-semibold text-white underline decoration-[var(--vv-accent)] underline-offset-4 transition hover:text-[var(--vv-accent)]">
        {match[1]}
      </Link>
    ) : match[1]);
    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

export default function ArticleBody({ body }: { body: string }) {
  const lines = body.split("\n").map((line) => line.trim()).filter(Boolean);
  const blocks: ReactNode[] = [];

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (line.startsWith("## ")) {
      blocks.push(
        <h2 key={index} className="mt-7 border-l-[3px] border-[var(--vv-accent)] pl-3 text-xl font-black leading-tight tracking-tight text-white sm:mt-10 sm:border-l-4 sm:pl-4 sm:text-3xl">
          {line.slice(3)}
        </h2>
      );
      continue;
    }

    if (line.startsWith("- ")) {
      const items: ReactNode[] = [];
      const start = index;
      while (index < lines.length && lines[index].startsWith("- ")) {
        items.push(<li key={index}>{linkedText(lines[index].slice(2))}</li>);
        index++;
      }
      blocks.push(<ul key={start} className="list-disc space-y-2 pl-6 marker:text-[var(--vv-accent)]">{items}</ul>);
      index--;
      continue;
    }

    blocks.push(<p key={index}>{linkedText(line)}</p>);
  }

  return <div className="space-y-4 text-[16px] leading-[1.75] text-white/78 sm:space-y-7 sm:text-lg sm:leading-8">{blocks}</div>;
}

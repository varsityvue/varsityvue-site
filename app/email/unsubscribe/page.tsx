import type { Metadata } from "next";
import Link from "next/link";

import { productEmailCategoryLabel, verifyProductEmailUnsubscribeToken } from "@/lib/product-email-unsubscribe";
import { confirmProductEmailUnsubscribe } from "./actions";

export const metadata: Metadata = {
  title: "Email Unsubscribe | VarsityVue",
  robots: { index: false, follow: false, nocache: true },
};

type PageProps = {
  searchParams: Promise<{ token?: string; status?: string; category?: string }>;
};

export default async function ProductEmailUnsubscribePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const payload = verifyProductEmailUnsubscribeToken(params.token);
  const completedCategory = params.category === "final_score" || params.category === "new_coverage" || params.category === "pickem_reminder" || params.category === "all"
    ? params.category
    : null;

  if (params.status === "success" && completedCategory) {
    return <UnsubscribeShell title="Preference updated" body={`${productEmailCategoryLabel(completedCategory)} is now off. This also cancels any unsent email in that category.`} />;
  }

  if (!payload || params.status === "invalid") {
    return <UnsubscribeShell title="This link is not valid" body="No email preference was changed. You can manage email preferences from your VarsityVue account." />;
  }

  return (
    <main className="min-h-screen bg-[#070707] px-4 py-16 text-white sm:px-6">
      <section className="mx-auto max-w-xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 sm:p-9">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--vv-accent)]">VarsityVue</p>
        <h1 className="mt-3 text-3xl font-black">Turn off {productEmailCategoryLabel(payload.category)}?</h1>
        <p className="mt-4 text-sm leading-6 text-white/55">You do not need to sign in. Reusing this link is safe and will leave the preference off.</p>
        <form action={confirmProductEmailUnsubscribe} className="mt-6">
          <input type="hidden" name="token" value={params.token} />
          <button className="rounded-full bg-[var(--vv-primary)] px-5 py-3 text-sm font-black">Confirm unsubscribe</button>
        </form>
        <Link href="/" className="mt-5 inline-block text-sm font-bold text-white/55 underline decoration-white/20 underline-offset-4 hover:text-white">Return to VarsityVue</Link>
      </section>
    </main>
  );
}

function UnsubscribeShell({ title, body }: { title: string; body: string }) {
  return (
    <main className="min-h-screen bg-[#070707] px-4 py-16 text-white sm:px-6">
      <section className="mx-auto max-w-xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 sm:p-9">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--vv-accent)]">VarsityVue</p>
        <h1 className="mt-3 text-3xl font-black">{title}</h1>
        <p className="mt-4 text-sm leading-6 text-white/55">{body}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/" className="rounded-full bg-[var(--vv-primary)] px-5 py-3 text-sm font-black">Return to VarsityVue</Link>
          <Link href="/account#email-preferences" className="rounded-full border border-white/15 px-5 py-3 text-sm font-black text-white/70">Email preferences</Link>
        </div>
      </section>
    </main>
  );
}

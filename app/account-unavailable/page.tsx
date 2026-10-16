import type { Metadata } from "next";
import Link from "next/link";
import { checkAccountAccess } from "./actions";
import { CheckAccessButton } from "./check-access-button";

export const metadata: Metadata = {
  title: "Member access temporarily unavailable",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AccountUnavailablePage({ searchParams }: {
  searchParams: Promise<{ checked?: string }>;
}) {
  const checked = (await searchParams).checked === "1";
  return <main className="mx-auto max-w-xl px-4 py-12 text-white">
    <h1 className="text-2xl font-bold">Member access temporarily unavailable</h1>
    <p className="mt-4">We could not verify your account access. Your session has not been signed out. Protected changes are paused until access can be verified.</p>
    <p className="mt-4">Wait a moment, then check access again. You do not need to reset your password again. Checking access will not repeat a score submission or save picks.</p>
    {checked && <p role="status" className="mt-4">We still could not verify access. Please try again later. If this continues, contact info@varsityvue.com.</p>}
    <div className="mt-6 flex flex-wrap items-center gap-6">
      <form action={checkAccountAccess}><CheckAccessButton /></form>
      <Link href="/games" prefetch={false}>Games &amp; Scores</Link>
    </div>
  </main>;
}

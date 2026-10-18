export default function PickemEntryStatus({ title, detail }: { title: string; detail: string }) {
  return <section aria-label="Contest entry status" className="mb-4 rounded-xl border border-white/25 bg-white/[0.06] p-4">
    <p className="text-sm font-black text-white">{title}</p>
    <p className="mt-1 text-xs leading-5 text-white/80">{detail}</p>
  </section>;
}

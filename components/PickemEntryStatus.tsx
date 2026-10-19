export default function PickemEntryStatus({ title, detail }: { title: string; detail: string }) {
  return <section aria-label="Contest entry status" className="mb-3 border-l-2 border-[var(--vv-accent)] pl-3 py-1">
    <p className="text-sm font-black text-white">{title}</p>
    <p className="mt-1 text-xs leading-4 text-white/80">{detail}</p>
  </section>;
}

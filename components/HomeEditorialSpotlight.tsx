import Image from "next/image";
import Link from "next/link";
import type { HomepageFeature } from "@/lib/homepage-feature";

export default function HomeEditorialSpotlight({ feature, href }: { feature: HomepageFeature; href: string | null }) {
  if (feature.feature_type === "playoff_preview") {
    return <div className="relative isolate mx-auto flex max-w-5xl flex-col items-center overflow-hidden py-8 text-center sm:py-14">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_10%,rgba(198,34,62,0.3),transparent_65%)]" />
      <p className="rounded-full border border-[var(--vv-accent)]/50 bg-[#9c172f]/20 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#ffffff]">The Road to State · 2026</p>
      <h2 className="mt-5 max-w-full text-5xl font-black uppercase italic leading-[0.9] tracking-[-0.055em] text-white sm:text-7xl lg:text-8xl">Playoff <span className="text-[var(--vv-accent)]">Central</span></h2>
      <p className="mt-5 max-w-2xl text-sm leading-6 text-white/75 sm:text-lg sm:leading-8">The regular season is over. Every game matters now. Follow Texas high school football on the road to state.</p>
      {href && <Link href={href} className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-[var(--vv-primary)] px-7 text-xs font-black uppercase tracking-[0.13em] text-white shadow-[0_10px_35px_rgba(181,29,55,0.25)] transition hover:bg-[var(--vv-primary-hover)]">Explore playoff matchups →</Link>}
    </div>;
  }
  return <div className="mx-auto flex max-w-4xl flex-col items-center py-5 text-center sm:py-9">
    {feature.image_path && <div className="relative mb-5 aspect-[2/1] w-full max-w-xl overflow-hidden rounded-xl border border-white/10"><Image src={feature.image_path} alt="" fill sizes="(max-width: 640px) 90vw, 576px" className="object-contain" /></div>}
    <h2 className="max-w-full break-words text-3xl font-black leading-tight tracking-tight sm:text-5xl">{feature.headline}</h2>
    <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65 sm:mt-5 sm:text-lg sm:leading-8">{feature.description}</p>
    {href && <Link href={href} className="mt-5 rounded-full bg-white px-5 py-3 text-center text-xs font-black uppercase tracking-[0.12em] text-black transition hover:bg-white/85 sm:mt-7">{feature.cta_label}</Link>}
  </div>;
}

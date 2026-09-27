import Image from "next/image";
import Link from "next/link";
import type { HomepageFeature } from "@/lib/homepage-feature";

export default function HomeEditorialSpotlight({ feature, href }: { feature: HomepageFeature; href: string | null }) {
  return <div className="mx-auto flex max-w-4xl flex-col items-center py-5 text-center sm:py-9">
    {feature.image_path && <div className="relative mb-5 aspect-[2/1] w-full max-w-xl overflow-hidden rounded-xl border border-white/10"><Image src={feature.image_path} alt="" fill sizes="(max-width: 640px) 90vw, 576px" className="object-contain" /></div>}
    <h2 className="max-w-full break-words text-3xl font-black leading-tight tracking-tight sm:text-5xl">{feature.headline}</h2>
    <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65 sm:mt-5 sm:text-lg sm:leading-8">{feature.description}</p>
    {href && <Link href={href} className="mt-5 rounded-full bg-white px-5 py-3 text-center text-xs font-black uppercase tracking-[0.12em] text-black transition hover:bg-white/85 sm:mt-7">{feature.cta_label}</Link>}
  </div>;
}

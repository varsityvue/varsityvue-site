import Image from "next/image";

export default function PickemSponsorMark({ name, logo }: { name: string; logo: string | null }) {
  return (
    <div className="mt-3 flex min-w-0 flex-wrap items-center gap-3 text-white/80">
      <p className="text-sm font-bold">Presented by <span className="text-white">{name}</span></p>
      {logo ? <div className="relative h-12 w-32 shrink-0 sm:h-14 sm:w-40">
        <Image src={logo} alt={`${name} logo`} fill sizes="(max-width: 640px) 128px, 160px" className="object-contain object-left" />
      </div> : null}
    </div>
  );
}

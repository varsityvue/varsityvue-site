import Image from "next/image";

export default function PickemSponsorMark({ name, logo }: { name: string; logo: string | null }) {
  return (
    <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-white/80">
      <p className="text-sm font-bold">Presented by <span className="text-white">{name}</span></p>
      {logo ? <div className="relative h-16 w-24 shrink-0 sm:h-[72px] sm:w-28">
        <Image src={logo} alt={`${name} logo`} fill sizes="(max-width: 640px) 96px, 112px" className="object-contain object-left" />
      </div> : null}
    </div>
  );
}

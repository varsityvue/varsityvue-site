import Image from "next/image";

export default function PickemSponsorMark({ name, logo }: { name: string; logo: string | null }) {
  return (
    <div className={`flex min-w-0 items-center text-white/80 ${logo ? "justify-between gap-4 sm:justify-center sm:gap-6" : ""}`}>
      <p className="shrink-0 whitespace-nowrap text-sm font-bold">Presented by{logo ? null : <> <span className="text-white">{name}</span></>}</p>
      {logo ? <div className="relative h-20 w-32 shrink-0 sm:w-36">
        <Image src={logo} alt={`${name} logo`} fill sizes="(max-width: 640px) 128px, 144px" className="object-contain object-right" />
      </div> : null}
    </div>
  );
}

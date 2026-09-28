import Image from "next/image";

export default function PickemSponsorMark({ name, logo }: { name: string; logo: string | null }) {
  return (
    <div className={`mt-2 min-w-0 items-center text-white/80 ${logo ? "grid grid-cols-[minmax(0,1fr)_8rem] gap-3 sm:grid-cols-[minmax(0,1fr)_9rem]" : "flex"}`}>
      <p className={`text-base leading-tight font-bold ${logo ? "justify-self-end text-right" : ""}`}>Presented by <span className="text-white">{name}</span></p>
      {logo ? <div className="relative h-20 w-32 justify-self-end sm:w-36">
        <Image src={logo} alt={`${name} logo`} fill sizes="(max-width: 640px) 128px, 144px" className="object-contain object-right" />
      </div> : null}
    </div>
  );
}

import Image from "next/image";

export default function PickemSponsorMark({ name, logo }: { name: string; logo: string | null }) {
  return (
    <div className={`${logo ? "grid grid-cols-2 gap-2" : "flex"} min-w-0 items-center text-white/80`}>
      <p className={`${logo ? "justify-self-center" : ""} whitespace-nowrap text-sm font-bold`}>Presented by{logo ? null : <> <span className="text-white">{name}</span></>}</p>
      {logo ? <div className="relative h-20 w-32 max-w-full justify-self-center sm:w-36">
        <Image src={logo} alt={`${name} logo`} fill sizes="(max-width: 640px) 128px, 144px" className="object-contain object-center" />
      </div> : null}
    </div>
  );
}

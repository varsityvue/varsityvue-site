import PickemSponsorMark from "@/components/PickemSponsorMark";
export default function MarkPage() {
  return <main style={{ padding: 12 }}>
    <PickemSponsorMark name="Gilder Storage" logo="/sponsors/gilder-storage-approved.png" />
    <PickemSponsorMark name="Gilder Storage" logo={null} />
  </main>;
}

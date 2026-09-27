import PickemSponsorMark from "@/components/PickemSponsorMark";

export default function SponsorRenderCheck() {
  return <main style={{ padding: 12 }}>
    <h1>Sponsor rendering check</h1>
    {[390, 400, 430, 1000].map((width) => (
      <section key={width} style={{ marginBottom: 24 }}>
        <h2>{width}px</h2>
        <div style={{ width, maxWidth: "100%", border: "1px solid #777", padding: 8 }}>
          <PickemSponsorMark name="Gilder Storage" logo="/sponsors/gilder-storage-approved.png" />
        </div>
      </section>
    ))}
    <h2>Name only</h2>
    <PickemSponsorMark name="Gilder Storage" logo={null} />
  </main>;
}

export default function SponsorRenderCheck() {
  return <main style={{ padding: 12 }}>
    <h1>Sponsor rendering check</h1>
    {[390, 400, 430, 1000].map((width) => (
      <section key={width} style={{ marginBottom: 24 }}>
        <h2>{width}px viewport</h2>
        <iframe title={`${width}px sponsor`} src="/sponsor-render-check/mark" width={width} height={200} style={{ border: "1px solid #777" }} />
      </section>
    ))}
  </main>;
}

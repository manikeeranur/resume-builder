// Shared by ResumeDocument (client) and lib/renderResumeHtml.js (server PDF/PNG render).
// position: fixed repeats an element on every printed page under
// Puppeteer/Chromium's page.pdf() — that's what makes one overlay cover a
// multi-page resume without touching any individual template's markup.
// One large diagonal line of text per page, corner to corner, rather than a
// tiled repeat — `vw` sizing scales it to the actual print page width (the
// PDF is re-flowed to A4 dimensions regardless of the render viewport), so
// it stays proportional no matter how long `text` is.
export default function Watermark({ text }) {
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <span
        style={{
          transform: "rotate(-35deg)",
          fontSize: "10vw",
          fontWeight: 800,
          letterSpacing: "0.02em",
          color: "rgba(109, 92, 232, 0.18)",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </span>
    </div>
  );
}

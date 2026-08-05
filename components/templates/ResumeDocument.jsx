import Template1 from "./Template1";
import Template2 from "./Template2";
import Template3 from "./Template3";
import Template4 from "./Template4";
import Template5 from "./Template5";
import Template6 from "./Template6";

const TEMPLATE_COMPONENTS = {
  "template-1": Template1,
  "template-2": Template2,
  "template-3": Template3,
  "template-4": Template4,
  "template-5": Template5,
  "template-6": Template6,
};

// position: fixed repeats an element on every printed page under
// Puppeteer/Chromium's page.pdf() — that's what makes one overlay cover a
// multi-page resume without touching any individual template's markup.
// One large diagonal line of text per page, corner to corner, rather than a
// tiled repeat — `vw` sizing scales it to the actual print page width (the
// PDF is re-flowed to A4 dimensions regardless of the render viewport), so
// it stays proportional no matter how long `text` is.
function Watermark({ text }) {
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

// `watermark` is resolved server-side (see app/resumes/[id]/print/page.jsx)
// from the viewer's own plan — never trust a client-passed flag for this.
export default function ResumeDocument({ resume, watermark = false, watermarkText = "ResumePro" }) {
  const Component = TEMPLATE_COMPONENTS[resume.templateId] || Template1;
  return (
    <>
      <Component resume={resume} />
      {watermark && <Watermark text={watermarkText} />}
    </>
  );
}

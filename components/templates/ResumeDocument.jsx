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
        flexWrap: "wrap",
        alignContent: "space-evenly",
        justifyContent: "space-evenly",
        overflow: "hidden",
      }}
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <span
          key={i}
          style={{
            transform: "rotate(-32deg)",
            fontSize: "20px",
            fontWeight: 700,
            color: "rgba(109, 92, 232, 0.18)",
            whiteSpace: "nowrap",
          }}
        >
          {text}
        </span>
      ))}
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

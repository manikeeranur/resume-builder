import Template1 from "./Template1";
import Template2 from "./Template2";
import Template3 from "./Template3";
import Template4 from "./Template4";

const TEMPLATE_COMPONENTS = {
  "template-1": Template1,
  "template-2": Template2,
  "template-3": Template3,
  "template-4": Template4,
};

export default function ResumeDocument({ resume }) {
  const Component = TEMPLATE_COMPONENTS[resume.templateId] || Template1;
  return <Component resume={resume} />;
}

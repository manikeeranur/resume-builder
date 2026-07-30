import Template1 from "./Template1";
import Template2 from "./Template2";

const TEMPLATE_COMPONENTS = {
  "template-1": Template1,
  "template-2": Template2,
};

export default function ResumeDocument({ resume }) {
  const Component = TEMPLATE_COMPONENTS[resume.templateId] || Template1;
  return <Component resume={resume} />;
}

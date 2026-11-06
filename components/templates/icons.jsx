// Plain-SVG copies of the two lucide-react icons the built-in templates use
// (same paths/attributes as lucide v1, MIT). lucide-react's Icon is a
// "use client" module, which makes it un-renderable in the server-side PDF
// HTML render (lib/renderResumeHtml.js); these have no such directive and
// produce identical markup.

function svgProps({ size = 24, color = "currentColor", strokeWidth = 2, className = "", name, ...rest }) {
  return {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: `lucide lucide-${name}${className ? ` ${className}` : ""}`,
    "aria-hidden": "true",
    ...rest,
  };
}

export function Mail(props) {
  return (
    <svg {...svgProps({ ...props, name: "mail" })}>
      <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
      <rect x="2" y="4" width="20" height="16" rx="2" />
    </svg>
  );
}

export function Phone(props) {
  return (
    <svg {...svgProps({ ...props, name: "phone" })}>
      <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />
    </svg>
  );
}

// Custom hover tooltip popping out to the right of a collapsed sidebar-rail
// icon — used instead of the native `title` attribute (browser tooltips are
// slow to appear, unstyled, and can't carry the app's own design tokens/
// arrow). The parent the icon lives in must have `group relative` on it —
// this renders as an absolutely-positioned sibling of the icon, anchored to
// that parent's right edge.
export default function RailTooltip({ children }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute left-full top-1/2 z-40 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-text px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-card-lg transition-all duration-150 group-hover:opacity-100 group-hover:delay-150"
    >
      {children}
      <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-text" />
    </span>
  );
}

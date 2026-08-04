import { Crown } from "lucide-react";

// Small corner badge for an avatar — parent must be `relative`.
export default function CrownBadge({ size = "sm" }) {
  const dims = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <span
      title="Premium member"
      className={`absolute -right-1 -top-1 flex ${dims} items-center justify-center rounded-full bg-amber-400 text-white shadow ring-2 ring-white`}
    >
      <Crown size={size === "sm" ? 10 : 12} strokeWidth={2.5} />
    </span>
  );
}

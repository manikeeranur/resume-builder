import { Crown } from "lucide-react";

const SIZES = {
  sm: { badge: "h-4 w-4", icon: 10 },
  md: { badge: "h-5 w-5", icon: 12 },
  lg: { badge: "h-7 w-7", icon: 16 },
};

// Small corner badge for an avatar — parent must be `relative`.
export default function CrownBadge({ size = "sm" }) {
  const { badge, icon } = SIZES[size] || SIZES.sm;
  return (
    <span
      title="Premium member"
      className={`absolute -right-1 -top-1 flex ${badge} items-center justify-center rounded-full bg-amber-400 text-white shadow ring-2 ring-white`}
    >
      <Crown size={icon} strokeWidth={2.5} />
    </span>
  );
}

import AvatarImage from "@/components/ui/AvatarImage";
import CrownBadge from "@/components/layout/CrownBadge";

const SIZES = {
  md: "h-24 w-24 sm:h-28 sm:w-28",
  lg: "h-28 w-28 sm:h-32 sm:w-32",
};

// A circular avatar wrapped in a soft gradient ring (outer gradient ->
// thin gap -> inner photo/initials circle), used everywhere a profile
// photo appears so the "circle" reads unmistakably, not just a plain
// rounded-full image.
export default function GradientAvatar({ photo, alt, initials, size = "md", isPremium, dark = false, children }) {
  return (
    <div className={`relative shrink-0 ${SIZES[size] || SIZES.md}`}>
      <div className="h-full w-full rounded-full bg-gradient-to-br from-primary via-[#8a7cf0] to-fuchsia-400 p-[3px] shadow-card-lg">
        <div className={`h-full w-full rounded-full p-1 ${dark ? "bg-[#241c4d]" : "bg-white"}`}>
          <div
            className={`relative flex h-full w-full items-center justify-center overflow-hidden rounded-full text-2xl font-bold sm:text-3xl ${
              dark ? "bg-white/10 text-white" : "bg-primary-light text-primary"
            }`}
          >
            {initials || "?"}
            <AvatarImage src={photo} alt={alt} className="absolute inset-0 h-full w-full rounded-full object-cover" />
          </div>
        </div>
      </div>
      {isPremium && <CrownBadge size="lg" />}
      {children}
    </div>
  );
}

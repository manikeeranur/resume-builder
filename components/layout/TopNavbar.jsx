import AvatarMenu from "./AvatarMenu";

export default function TopNavbar({ user, avatarUrl, isPremium, googleEnabled }) {
  return (
    <div className="sticky top-0 z-10 hidden items-center justify-end border-b border-border bg-white/95 px-6 py-3 backdrop-blur-md md:flex">
      <AvatarMenu user={user} avatarUrl={avatarUrl} isPremium={isPremium} googleEnabled={googleEnabled} />
    </div>
  );
}

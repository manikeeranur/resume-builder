import AvatarMenu from "./AvatarMenu";
import NotificationBell from "./NotificationBell";

export default function TopNavbar({ user, avatarUrl, isPremium, googleEnabled }) {
  return (
    <div className="sticky top-0 z-10 hidden items-center justify-end gap-2 border-b border-border bg-white/95 px-6 py-3 backdrop-blur-md md:flex">
      <NotificationBell />
      <AvatarMenu user={user} avatarUrl={avatarUrl} isPremium={isPremium} googleEnabled={googleEnabled} />
    </div>
  );
}

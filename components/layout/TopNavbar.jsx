import AvatarMenu from "./AvatarMenu";

export default function TopNavbar({ user, avatarUrl }) {
  return (
    <div className="sticky top-0 z-10 hidden items-center justify-end border-b border-border bg-white/95 px-6 py-3 backdrop-blur-md md:flex">
      <AvatarMenu user={user} avatarUrl={avatarUrl} />
    </div>
  );
}

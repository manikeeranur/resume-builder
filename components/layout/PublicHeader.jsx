import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const NAV_LINKS = [
  { href: "/templates", label: "Templates" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
];

export default async function PublicHeader() {
  const session = await getServerSession(authOptions);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="ResumePro" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
          <span className="text-sm font-bold text-text">ResumePro</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-text-secondary transition-colors hover:text-text"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {session ? (
            <Link href="/dashboard" className="btn-primary rounded-xl px-4 py-2 text-sm">
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text"
              >
                Log in
              </Link>
              <Link href="/signup" className="btn-primary rounded-xl px-4 py-2 text-sm">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

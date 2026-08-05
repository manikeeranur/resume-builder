import Link from "next/link";

const PRODUCT_LINKS = [
  { href: "/templates", label: "Templates" },
  { href: "/pricing", label: "Pricing" },
  { href: "/login", label: "Log in" },
  { href: "/signup", label: "Sign up" },
];

const LEGAL_LINKS = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/refund-policy", label: "Cancellation & Refund Policy" },
  { href: "/shipping-policy", label: "Shipping Policy" },
];

export default function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
              R
            </span>
            <span className="text-base font-bold text-text">ResumePro</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-text-secondary">
            Build, customize, and download professional resumes online. Operated by Manikandan Arumugam, Chennai,
            Tamil Nadu, India.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-text">Product</h3>
          <ul className="mt-3 space-y-2">
            {PRODUCT_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-text-secondary hover:text-text">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-text">Legal</h3>
          <ul className="mt-3 space-y-2">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-text-secondary hover:text-text">
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/contact" className="text-sm text-text-secondary hover:text-text">
                Contact Us
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto max-w-[1200px] px-4 py-4 text-xs text-text-secondary sm:px-6">
          &copy; {year} ResumePro. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

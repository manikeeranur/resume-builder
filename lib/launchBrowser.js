import path from "node:path";

export async function launchBrowser() {
  if (process.platform === "linux") {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteer = await import("puppeteer-core");
    const chromiumBin = path.join(process.cwd(), "node_modules", "@sparticuz", "chromium", "bin");
    return puppeteer.launch({
      args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: await chromium.executablePath(chromiumBin),
      headless: true,
    });
  }
  const puppeteer = await import("puppeteer");
  return puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });
}

// The origin Puppeteer should navigate back into the app on. Normally the
// incoming request's own origin is authoritative — but behind some reverse
// proxies (e.g. an AWS box where nginx isn't configured with
// `proxy_set_header Host $host;`) Next.js only sees the app's own internal
// bind address, so req.url's origin comes out as e.g. http://localhost:3002
// instead of the public domain. Puppeteer would then try to reach that
// unreachable/wrong-scheme address instead of the real deployment. Falling
// back to NEXTAUTH_URL whenever the derived origin is a loopback address
// catches that case, while still preferring the real request origin
// everywhere else (e.g. Vercel, where it's always correct and NEXTAUTH_URL
// is the one that tends to drift stale).
export function resolveOrigin(req) {
  const origin = new URL(req.url).origin;
  const isLoopback = /^https?:\/\/(localhost|127(?:\.\d{1,3}){3}|\[::1\])(?::\d+)?$/i.test(origin);
  return isLoopback ? process.env.NEXTAUTH_URL || origin : origin;
}

// Forwards the incoming request's cookies (NextAuth session included) to the
// puppeteer page so it can load an authenticated app route.
export async function forwardCookies(page, req, origin) {
  const cookies = req.cookies.getAll();
  if (!cookies.length) return;
  const url = new URL(origin);
  const secure = url.protocol === "https:";
  await page.setCookie(
    ...cookies.map((c) => ({
      name: c.name,
      value: c.value,
      // __Host- cookies are required to be host-only — setting a Domain
      // attribute on one violates the cookie-prefix spec and makes Chrome
      // reject the whole Network.setCookies call ("Invalid cookie fields").
      // Scope them via `url` instead. (Puppeteer would otherwise infer `url`
      // from the page's current URL, but this runs before page.goto(), while
      // the page is still on about:blank — so it has to be given explicitly.)
      ...(c.name.startsWith("__Host-") ? { url: origin } : { domain: url.hostname }),
      path: "/",
      // __Secure-/__Host- prefixed cookies require the Secure attribute.
      secure,
    }))
  );
}

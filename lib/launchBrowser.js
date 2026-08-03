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
      ...(c.name.startsWith("__Host-") ? {} : { domain: url.hostname }),
      path: "/",
      // __Secure-/__Host- prefixed cookies require the Secure attribute.
      secure,
    }))
  );
}

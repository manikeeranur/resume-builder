// Shared allowlist for chat message bodies — used server-side when an
// admin's TipTap draft is saved, and again client-side right before
// ChatBubbleList renders it (defense in depth for any record written
// before this pass existed, or written directly against the API). Kept
// deliberately small: only the marks the composer's toolbar can produce.
//
// Hand-rolled instead of DOMPurify/jsdom: jsdom 28+ pulls in @exodus/bytes,
// an ESM-only package that crashes with ERR_REQUIRE_ESM under Vercel's
// Node runtime the moment this module loads — and even pinning jsdom back
// further, its CSS engine reads a stylesheet asset via a path that breaks
// once Next's webpack bundles the route, failing the build outright. The
// actual allowlist here is tiny and fixed, so a small tokenizer avoids
// depending on a full (and, in this bundling environment, unstable) DOM
// implementation.
const ALLOWED_TAGS = new Set(["p", "br", "strong", "b", "em", "i", "s", "strike", "code"]);
// Tags whose content (not just the tag itself) must never survive —
// dropping only the tag and keeping "alert(1)" as bare text would still be
// wrong for something like <script>, so these strip through to the
// matching close tag instead of falling through to the generic
// keep-the-text-drop-the-tag behavior every other disallowed tag gets.
const DROP_CONTENT_TAGS = new Set(["script", "style", "iframe", "object", "embed", "svg", "math", "noscript", "template", "link", "meta", "head", "title"]);
const TOKEN_RE = /<!--[\s\S]*?-->|<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;

export function sanitizeChatHtml(html) {
  const input = html || "";
  let output = "";
  let skipTag = null; // set while inside a DROP_CONTENT_TAGS element
  let skipDepth = 0; // handles same-tag nesting, e.g. <script><script>
  let lastIndex = 0;
  let match;

  TOKEN_RE.lastIndex = 0;
  while ((match = TOKEN_RE.exec(input)) !== null) {
    const [full, tagName] = match;
    const textBefore = input.slice(lastIndex, match.index);
    lastIndex = TOKEN_RE.lastIndex;
    if (skipDepth === 0 && textBefore) output += textBefore;

    if (full.startsWith("<!--") || !tagName) continue;
    const lower = tagName.toLowerCase();
    const isClosing = full[1] === "/";

    if (skipDepth > 0) {
      if (lower !== skipTag) continue;
      if (isClosing) {
        skipDepth -= 1;
        if (skipDepth === 0) skipTag = null;
      } else {
        skipDepth += 1;
      }
      continue;
    }

    if (DROP_CONTENT_TAGS.has(lower)) {
      if (!isClosing) {
        skipTag = lower;
        skipDepth = 1;
      }
      continue;
    }

    if (ALLOWED_TAGS.has(lower)) output += isClosing ? `</${lower}>` : `<${lower}>`;
    // Any other disallowed tag: drop the markup, keep the text around it —
    // already appended above via textBefore.
  }
  if (skipDepth === 0) output += input.slice(lastIndex);
  return output;
}

// Emptiness/length checks need the visible text, not tag noise.
export function chatHtmlToPlainText(html) {
  return sanitizeChatHtml(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

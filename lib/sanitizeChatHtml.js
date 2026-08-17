import DOMPurify from "isomorphic-dompurify";

// Shared allowlist for chat message bodies — used server-side when an
// admin's TipTap draft is saved, and again client-side right before
// ChatBubbleList renders it (defense in depth for any record written
// before this pass existed, or written directly against the API). Kept
// deliberately small: only the marks the composer's toolbar can produce.
const CONFIG = {
  ALLOWED_TAGS: ["p", "br", "strong", "b", "em", "i", "s", "strike", "code"],
  ALLOWED_ATTR: [],
};

export function sanitizeChatHtml(html) {
  return DOMPurify.sanitize(html || "", CONFIG);
}

// Emptiness/length checks need the visible text, not tag noise.
export function chatHtmlToPlainText(html) {
  return sanitizeChatHtml(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

// Chat message bodies are rendered as HTML (see sanitizeChatHtml) so admin
// replies can carry rich-text marks from the TipTap editor. Plain senders
// (the user-facing ChatWidget) still submit raw text, so it has to be
// escaped into literal HTML on the way in — otherwise "<" typed by a user
// would be parsed as a tag instead of displayed as a character.
export function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

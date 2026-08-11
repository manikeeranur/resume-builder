// Fetches `url` and always reads the body as text first, instead of calling
// res.json() directly — that throws a bare "Unexpected end of JSON input"
// with no way to see what the server actually sent back (an empty body? an
// HTML error page? truncated JSON from a dropped connection?). This surfaces
// the real HTTP status and a snippet of the raw body in the thrown error
// instead, so a broken response is diagnosable from the error message alone
// rather than needing to reproduce it with devtools open.
export async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const text = await res.text();

  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    const snippet = text.slice(0, 300);
    throw new Error(`Server returned a non-JSON response (HTTP ${res.status} ${res.statusText}): ${snippet || "(empty body)"}`);
  }

  if (!res.ok) {
    throw new Error(data.error || `Request failed (HTTP ${res.status} ${res.statusText})`);
  }

  return data;
}

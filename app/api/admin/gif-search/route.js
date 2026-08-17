import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";

const GIPHY_BASE = "https://api.giphy.com/v1/gifs";

// Proxies to Giphy so GIPHY_API_KEY stays server-side — the chat composer's
// GIF popover calls this instead of hitting Giphy directly from the browser.
export async function GET(req) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const apiKey = process.env.GIPHY_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GIF search isn't configured (missing GIPHY_API_KEY)" }, { status: 501 });

  const q = new URL(req.url).searchParams.get("q")?.trim() || "";
  const endpoint = q ? "search" : "trending";
  const params = new URLSearchParams({ api_key: apiKey, limit: "24", rating: "pg-13" });
  if (q) params.set("q", q);

  const res = await fetch(`${GIPHY_BASE}/${endpoint}?${params.toString()}`);
  if (!res.ok) return NextResponse.json({ error: "GIF search failed" }, { status: 502 });

  const data = await res.json();
  const gifs = (data.data || []).map((g) => ({
    id: g.id,
    previewUrl: g.images?.fixed_width_small?.url || g.images?.fixed_width?.url,
    url: g.images?.fixed_width?.url || g.images?.original?.url,
  }));

  return NextResponse.json({ gifs });
}

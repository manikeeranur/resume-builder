import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Returns the session if the caller is an authenticated admin, otherwise
// null — callers respond 401/403/redirect as fits their context (API route
// vs. page). session.user.role is populated by the jwt/session callbacks in
// lib/auth.js from the live User.role, not trusted from anywhere client-side.
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") return null;
  return session;
}

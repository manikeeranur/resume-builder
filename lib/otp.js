import crypto from "crypto";
import EmailOtp from "@/lib/models/EmailOtp";

export const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

const generateCode = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
const hashCode = (code) => crypto.createHash("sha256").update(code).digest("hex");

// Creates a fresh 6-digit code for `email`/`purpose`, invalidating any
// still-outstanding one for that same pair first — only the most recently
// issued code is ever valid, so an earlier "resend" doesn't leave two live
// codes an attacker could try both of. Only the SHA-256 hash is persisted;
// the plaintext code is returned once, for the caller to email and forget.
// Throws if called again inside RESEND_COOLDOWN_SECONDS of the last send,
// so a "resend" button (or a script) can't be used to spam someone's inbox.
export async function issueOtp({ email, purpose }) {
  const normalizedEmail = email.toLowerCase();
  const recent = await EmailOtp.findOne({ email: normalizedEmail, purpose }).sort({ createdAt: -1 });
  if (recent && !recent.consumedAt) {
    const secondsSinceIssued = (Date.now() - recent.createdAt.getTime()) / 1000;
    if (secondsSinceIssued < RESEND_COOLDOWN_SECONDS) {
      const err = new Error(`Please wait ${Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceIssued)}s before requesting another code`);
      err.code = "COOLDOWN";
      throw err;
    }
  }

  await EmailOtp.deleteMany({ email: normalizedEmail, purpose, consumedAt: null });

  const code = generateCode();
  await EmailOtp.create({
    email: normalizedEmail,
    purpose,
    otpHash: hashCode(code),
    expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
  });
  return code;
}

// Verifies `code` against the latest outstanding OTP for `email`/`purpose`.
// Returns silently on success; throws a user-facing message otherwise. A
// wrong guess counts against MAX_ATTEMPTS before the code is dead even if
// it hasn't technically expired — keeps a 6-digit code from being brute-
// forceable within its lifetime.
export async function verifyOtp({ email, purpose, code }) {
  const normalizedEmail = email.toLowerCase();
  const record = await EmailOtp.findOne({ email: normalizedEmail, purpose, consumedAt: null }).sort({ createdAt: -1 });
  if (!record) throw new Error("No verification code found for this email — request a new one");
  if (record.expiresAt < new Date()) throw new Error("This code has expired — request a new one");
  if (record.attempts >= MAX_ATTEMPTS) throw new Error("Too many incorrect attempts — request a new code");

  if (record.otpHash !== hashCode(code)) {
    record.attempts += 1;
    await record.save();
    throw new Error("Incorrect code");
  }

  record.consumedAt = new Date();
  await record.save();
}

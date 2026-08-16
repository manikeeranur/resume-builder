import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import Profile from "@/lib/models/Profile";
import PendingSignup from "@/lib/models/PendingSignup";
import { emptyResumeSections } from "@/lib/resumeDefaults";
import { sendWelcomeEmail } from "@/lib/email";

const providers = [
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;

      await dbConnect();
      const email = credentials.email.toLowerCase();
      const user = await User.findOne({ email });
      if (!user) {
        // No real account yet — could just be a wrong email, or could be a
        // signup still waiting on its OTP (see lib/models/PendingSignup;
        // that's the only place a credentials signup's data lives until
        // it's verified, so there's no User row to find here at all).
        // Password-check the pending record before treating it as the
        // latter, so a wrong guess still can't be used to probe which
        // emails have a signup in flight.
        const pending = await PendingSignup.findOne({ email });
        if (pending && (await pending.comparePassword(credentials.password))) {
          throw new Error("EmailNotVerified");
        }
        return null;
      }

      const valid = await user.comparePassword(credentials.password);
      if (!valid) return null;

      // Same generic "invalid credentials" rejection as a wrong password —
      // doesn't confirm to an outsider whether the email exists or is blocked.
      if (user.isBlocked) return null;

      // Unlike isBlocked, this one throws a distinguishable message instead
      // of returning null — LoginForm matches on it to show a "verify your
      // email" prompt (with a resend link) rather than a plain "wrong
      // password", since this is something the user can actually act on.
      // See core/routes/callback.js in next-auth: a thrown Error's message
      // is what `signIn(..., { redirect: false })` surfaces as `res.error`.
      if (!user.emailVerified) throw new Error("EmailNotVerified");

      return { id: user._id.toString(), name: user.name, email: user.email, image: user.image };
    },
  }),
];

// Google sign-in only appears once real OAuth credentials are configured.
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const authOptions = {
  providers,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;

      await dbConnect();
      const existing = await User.findOne({ email: user.email.toLowerCase() });
      // Credentials logins are blocked in authorize() above — Google's own
      // sign-in path bypasses that, so it needs the same check here.
      if (existing?.isBlocked) return false;
      const isNewUser = !existing;
      const userId = existing
        ? existing._id
        : (
            await User.create({
              name: user.name,
              email: user.email.toLowerCase(),
              image: user.image,
              provider: "google",
              emailVerified: true,
            })
          )._id;
      user.id = userId.toString();

      // Google has already confirmed this inbox belongs to them, so an
      // account that exists but was never verified (e.g. a credentials
      // signup that skipped the OTP step, or signed up before this field
      // existed) is verified the moment they successfully sign in via
      // Google — no separate OTP step needed for something Google already
      // proved.
      if (existing && !existing.emailVerified) {
        await User.updateOne({ _id: existing._id }, { $set: { emailVerified: true } });
      }

      if (isNewUser) {
        sendWelcomeEmail({ to: user.email.toLowerCase(), name: user.name }).catch(() => {});
      }

      // Fill in whatever's still blank on the master profile from Google's
      // account data, on every login (not just sign-up) — covers accounts
      // created before this existed, and re-checks in case a field was
      // cleared. Never overwrites a field the user has already set, whether
      // from a prior Google login or a manual edit on /profile.
      const profile = await Profile.findOne({ userId });
      if (!profile) {
        await Profile.create({
          userId,
          sections: {
            ...emptyResumeSections,
            personalInfo: {
              ...emptyResumeSections.personalInfo,
              fullName: user.name || "",
              email: user.email.toLowerCase(),
              photo: user.image || "",
            },
          },
        });
      } else {
        const pi = profile.sections?.personalInfo || {};
        const updates = {};
        if (!pi.fullName && user.name) updates["sections.personalInfo.fullName"] = user.name;
        if (!pi.email && user.email) updates["sections.personalInfo.email"] = user.email.toLowerCase();
        if (!pi.photo && user.image) updates["sections.personalInfo.photo"] = user.image;
        if (Object.keys(updates).length) {
          await Profile.updateOne({ userId }, { $set: updates });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      // Re-read on every request (not just at sign-in) so a role change
      // made by another admin takes effect on the user's next request
      // instead of requiring them to sign out and back in. Same mechanism
      // also catches a block: throwing here invalidates the token, so a
      // user blocked mid-session is signed out on their very next request
      // rather than keeping access until the JWT naturally expires.
      await dbConnect();
      const dbUser = await User.findById(token.id).select("role isBlocked");
      if (dbUser?.isBlocked) throw new Error("AccountBlocked");
      token.role = dbUser?.role || "user";
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

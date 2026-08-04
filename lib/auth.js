import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import Profile from "@/lib/models/Profile";
import { emptyResumeSections } from "@/lib/resumeDefaults";

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
      const user = await User.findOne({ email: credentials.email.toLowerCase() });
      if (!user) return null;

      const valid = await user.comparePassword(credentials.password);
      if (!valid) return null;

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
      const userId = existing
        ? existing._id
        : (
            await User.create({
              name: user.name,
              email: user.email.toLowerCase(),
              image: user.image,
              provider: "google",
            })
          )._id;
      user.id = userId.toString();

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
      // instead of requiring them to sign out and back in.
      await dbConnect();
      const dbUser = await User.findById(token.id).select("role");
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

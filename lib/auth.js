import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";

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
      if (!existing) {
        const created = await User.create({
          name: user.name,
          email: user.email.toLowerCase(),
          image: user.image,
          provider: "google",
        });
        user.id = created._id.toString();
      } else {
        user.id = existing._id.toString();
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

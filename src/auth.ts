import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateUniqueWalletAddress } from "@/lib/wallet";
import { getGoogleOAuthEnv } from "@/lib/googleOAuthEnv";

const googleEnv = getGoogleOAuthEnv();

const providers = [
  Credentials({
    name: "Email & password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;
      const email = String(credentials.email).toLowerCase().trim();
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user?.passwordHash || user.memberStatus !== "ACTIVE") return null;
      const ok = await bcrypt.compare(String(credentials.password), user.passwordHash);
      if (!ok) return null;
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        profileComplete: user.profileComplete,
      };
    },
  }),
  ...(googleEnv
    ? [
        Google({
          clientId: googleEnv.clientId,
          clientSecret: googleEnv.clientSecret,
        }),
      ]
    : []),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  /** Wajib untuk App Router — hindari inferensi `basePath` dari `AUTH_URL` yang pathname-nya `/` (bisa jadi `/` dan merusak `/api/auth`). */
  basePath: "/api/auth",
  /** Produksi (Vercel): percayai Host header; tanpa ini `auth()` bisa gagal di domain produksi. */
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
  },
  providers,
  callbacks: {
    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.id = user.id;
        token.sub = user.id;
        token.role = user.role ?? "USER";
        token.profileComplete = user.profileComplete ?? false;
      }
      if (account?.provider === "google" && user?.email) {
        const db = await prisma.user.findUnique({ where: { email: user.email } });
        if (db) {
          token.id = db.id;
          token.sub = db.id;
          token.role = db.role;
          token.profileComplete = db.profileComplete;
        }
      }
      if (trigger === "update" && token.id) {
        const db = await prisma.user.findUnique({ where: { id: token.id as string } });
        if (db) {
          token.profileComplete = db.profileComplete;
          token.role = db.role;
          token.name = db.name;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as "USER" | "ADMIN") ?? "USER";
        session.user.profileComplete = Boolean(token.profileComplete);
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      const walletAddress = await generateUniqueWalletAddress(prisma);
      await prisma.user.update({
        where: { id: user.id },
        data: { walletAddress },
      });
    },
  },
});

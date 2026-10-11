import NextAuth, { CredentialsSignin, type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { checkRateLimit } from "@/lib/rate-limit";

export type Role = "customer" | "support" | "admin";

declare module "next-auth" {
  interface Session {
    user: { id: string; role: Role } & DefaultSession["user"];
  }
}
declare module "@auth/core/jwt" {
  interface JWT {
    uid?: string;
    role?: Role;
  }
}

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;

class EmailNotVerified extends CredentialsSignin {
  code = "email_not_verified";
}
class AccountLocked extends CredentialsSignin {
  code = "account_locked";
}

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7, updateAge: 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    Credentials({
      name: "Email and password",
      credentials: { email: {}, password: {} },
      async authorize(raw, request) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const ip = request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
        const limit = checkRateLimit(`login:${ip}:${email}`, 10, 15 * 60_000);
        if (!limit.ok) throw new CredentialsSignin();

        const user = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
        // Constant-ish timing for unknown accounts.
        const hash = user?.passwordHash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv";
        const valid = await bcrypt.compare(password, hash);

        if (!user || !user.passwordHash) throw new CredentialsSignin();

        if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) throw new AccountLocked();

        if (!valid) {
          const failed = user.failedLogins + 1;
          await db
            .update(schema.users)
            .set({
              failedLogins: failed >= MAX_FAILED ? 0 : failed,
              lockedUntil: failed >= MAX_FAILED ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
            })
            .where(eq(schema.users.id, user.id));
          throw new CredentialsSignin();
        }

        if (!user.emailVerified) throw new EmailNotVerified();

        await db
          .update(schema.users)
          .set({ failedLogins: 0, lockedUntil: null })
          .where(eq(schema.users.id, user.id));

        return { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role as Role };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: { params: { prompt: "select_account" } },
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Google sign-in: create or link the local account. Only trust verified Google emails.
      if (account?.provider === "google") {
        const email = (profile?.email as string | undefined)?.toLowerCase();
        if (!email || profile?.email_verified !== true) return false;

        const existing = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
        if (!existing) {
          await db.insert(schema.users).values({
            id: crypto.randomUUID(),
            email,
            name: (profile?.name as string) ?? user.name ?? null,
            image: (profile?.picture as string) ?? null,
            emailVerified: new Date(),
          });
        } else if (!existing.emailVerified) {
          await db.update(schema.users).set({ emailVerified: new Date() }).where(eq(schema.users.id, existing.id));
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user?.email || account?.provider === "google") {
        const email = (user?.email ?? "").toLowerCase();
        const dbUser = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
        if (dbUser) {
          token.uid = dbUser.id;
          token.role = dbUser.role as Role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.uid) session.user.id = token.uid;
      session.user.role = (token.role ?? "customer") as Role;
      return session;
    },
  },
});

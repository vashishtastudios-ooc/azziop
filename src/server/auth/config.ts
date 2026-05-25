import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { db } from "~/server/db";
import {
  resolveGoogleSignIn,
  type GoogleProfileInput,
} from "~/server/auth/googleUser";

const googleClientId = process.env.AUTH_GOOGLE_ID;
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET;
export const isGoogleAuthEnabled = Boolean(
  googleClientId && googleClientSecret,
);

const providers = [
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      mobile: { label: "Mobile", type: "text" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      try {
        const identifier =
          typeof credentials?.mobile === "string"
            ? credentials.mobile.trim()
            : undefined;
        const password =
          typeof credentials?.password === "string"
            ? credentials.password
            : undefined;

        if (!identifier || !password) {
          console.log("[auth] Missing identifier or password");
          return null;
        }

        console.log(
          "[auth] Searching for user with identifier:",
          identifier,
          "Type:",
          typeof identifier,
        );

        const normalizeMobile = (mobile: string) => {
          const digitsOnly = mobile.replace(/\D/g, "");
          return digitsOnly.replace(/^0+/, "") || digitsOnly;
        };

        const normalizedIdentifier = normalizeMobile(identifier);
        console.log("[auth] Normalized identifier:", normalizedIdentifier);

        let user = await db.user.findFirst({
          where: {
            OR: [
              { mobile: identifier },
              { mobile: { startsWith: normalizedIdentifier } },
              { email: identifier },
            ],
          },
        });

        if (!user) {
          console.log(
            "[auth] User not found with exact match, trying normalized search...",
          );
          const allUsers = await db.user.findMany({
            select: { id: true, mobile: true, email: true },
          });

          const matchedUser = allUsers.find((u) => {
            if (!u.mobile) return false;
            const normalizedDbMobile = normalizeMobile(u.mobile);
            return (
              normalizedDbMobile === normalizedIdentifier ||
              u.email === identifier
            );
          });

          if (matchedUser) {
            const fullUser = await db.user.findUnique({
              where: { id: matchedUser.id },
            });

            if (fullUser) {
              console.log("[auth] User found via normalized mobile:", {
                id: fullUser.id,
                mobile: fullUser.mobile,
              });
              user = fullUser;
            } else {
              console.log("[auth] User not found for identifier:", identifier);
              return null;
            }
          } else {
            console.log("[auth] User not found for identifier:", identifier);
            return null;
          }
        }

        console.log("[auth] User found:", {
          id: user.id,
          mobile: user.mobile,
          email: user.email,
        });

        if (!user.passwordHash) {
          console.log(
            "[auth] User has no password — account uses Google sign-in",
          );
          return null;
        }

        const valid = await compare(password, user.passwordHash);

        if (!valid) {
          console.log("[auth] Password comparison failed for user:", user.id);
          return null;
        }

        console.log("[auth] Authentication successful for user:", user.id);
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatarUrl ?? undefined,
          mobile: user.mobile,
          planId: user.planId ?? "free",
        };
      } catch (error) {
        console.error("[auth] Error in authorize:", error);
        return null;
      }
    },
  }),
];

if (isGoogleAuthEnabled) {
  providers.push(
    GoogleProvider({
      clientId: googleClientId!,
      clientSecret: googleClientSecret!,
    }),
  );
}

export const authConfig = {
  trustHost: true,
  providers,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt" as const,
  },
  callbacks: {
    async signIn({
      user,
      account,
    }: {
      user: { email?: string | null };
      account?: { provider?: string } | null;
    }) {
      if (account?.provider === "google") {
        return Boolean(user.email?.trim());
      }
      return true;
    },
    async jwt({
      token,
      user,
      account,
      profile,
    }: {
      token: Record<string, unknown>;
      user?: {
        id?: string;
        mobile?: string | null;
        planId?: string;
        email?: string | null;
        name?: string | null;
        image?: string | null;
      };
      account?: { provider?: string } | null;
      profile?: GoogleProfileInput;
    }) {
      if (account?.provider === "google") {
        const googleProfile = profile ?? {
          email: user?.email,
          name: user?.name,
          picture: user?.image,
        };
        const dbUser = await resolveGoogleSignIn(googleProfile);
        if (!dbUser) return token;

        token.id = dbUser.id;
        token.mobile = dbUser.mobile ?? undefined;
        token.planId = dbUser.planId ?? "free";
        token.email = dbUser.email ?? undefined;
        token.name = dbUser.name;
        token.picture = dbUser.avatarUrl ?? user?.image ?? undefined;
        return token;
      }

      if (user) {
        token.id = user.id ?? token.sub;
        token.mobile = user.mobile ?? undefined;
        token.planId = user.planId ?? "free";
      }
      return token;
    },
    async session({
      session,
      token,
    }: {
      session: {
        user: {
          id: string;
          mobile?: string | null;
          planId?: string;
          email?: string | null;
          name?: string | null;
          image?: string | null;
        };
      };
      token: Record<string, unknown>;
    }) {
      if (token) {
        session.user.id = (token.id ?? token.sub) as string;
        session.user.mobile = (token.mobile as string | null | undefined) ?? null;
        session.user.planId = (token.planId as string | undefined) ?? "free";
        if (token.email) session.user.email = token.email as string;
        if (token.name) session.user.name = token.name as string;
        if (token.picture) session.user.image = token.picture as string;
      }
      return session;
    },
  },
};

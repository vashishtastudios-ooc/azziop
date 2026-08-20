import { z } from "zod";
import { hash, compare } from "bcryptjs";
import { randomBytes, createHash } from "crypto";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import { grantCredits } from "~/lib/credits";
import { creditReasonLabel } from "~/lib/creditActivity";
import { getAccountUsage } from "~/lib/quota";
import { planById } from "~/lib/pricing";
import { getMonthlyCreditsForPlan, getCreditCosts } from "~/lib/billingRuntime";
import { sendPasswordResetEmail } from "~/server/lib/mailer";
import { env } from "~/env";
import { isAdminAccount } from "~/lib/admin";
import { getFeatureFlags } from "~/lib/featureFlags";

const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function appBaseUrl(): string {
  return (env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(
    /\/+$/,
    "",
  );
}

export const userRouter = createTRPCRouter({
    /**
     * Register a new user (public — no auth required)
     */
    register: publicProcedure
        .input(
            z.object({
                name: z.string().min(1, "Name is required").trim(),
                email: z.string().email("Valid email required").trim(),
                mobile: z.string().trim().optional().or(z.literal("")),
                password: z.string().min(6, "Password must be at least 6 characters"),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { name, password } = input;
            const email = input.email.trim().toLowerCase();
            const mobile = input.mobile?.trim() || null;

            // Check for existing user
            const existing = await ctx.db.user.findFirst({
                where: {
                    OR: [
                        { email },
                        ...(mobile ? [{ mobile }] : []),
                    ],
                },
            });

            if (existing) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "An account with this email or mobile number already exists",
                });
            }

            // Hash password and create user
            const passwordHash = await hash(password, 12);

            const user = await ctx.db.user.create({
                data: {
                    name,
                    mobile,
                    email,
                    passwordHash,
                },
            });

            // One-time free-trial credits.
            await grantCredits({
                userId: user.id,
                amount: await getMonthlyCreditsForPlan("free"),
                reason: "plan_grant",
                sourceId: `grant:free-signup:${user.id}`,
                metadata: { planId: "free", source: "register" },
            });

            return { userId: user.id, message: "Account created successfully" };
        }),

    /**
     * Login — validate credentials server-side (public)
     * Returns user info on success. Session creation still happens via NextAuth signIn.
     */
    login: publicProcedure
        .input(
            z.object({
                mobile: z.string().min(1, "Mobile number is required").trim(),
                password: z.string().min(1, "Password is required"),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { mobile, password } = input;

            // Find user by mobile or email
            const user = await ctx.db.user.findFirst({
                where: {
                    OR: [{ mobile }, { email: mobile }],
                },
            });

            if (!user) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "No account found with this mobile number",
                });
            }

            if (!user.passwordHash) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message:
                        "This account uses Google sign-in. Please continue with Google.",
                });
            }

            const valid = await compare(password, user.passwordHash);
            if (!valid) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Incorrect password",
                });
            }

            return {
                userId: user.id,
                name: user.name,
                mobile: user.mobile,
                message: "Login successful",
            };
        }),

    /**
     * Request a password reset link (public).
     * Always returns success to avoid leaking which emails are registered.
     */
    requestPasswordReset: publicProcedure
        .input(
            z.object({
                email: z.string().email("Enter a valid email").trim(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const email = input.email.trim().toLowerCase();
            const user = await ctx.db.user.findFirst({ where: { email } });

            // Only send if the account exists AND uses password login. Google-only
            // accounts have no password to reset.
            if (user?.passwordHash) {
                try {
                    // Invalidate any previous unused tokens for this user.
                    await ctx.db.passwordResetToken.deleteMany({
                        where: { userId: user.id, usedAt: null },
                    });

                    const rawToken = randomBytes(32).toString("hex");
                    await ctx.db.passwordResetToken.create({
                        data: {
                            userId: user.id,
                            tokenHash: hashResetToken(rawToken),
                            expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
                        },
                    });

                    const resetUrl = `${appBaseUrl()}/reset-password?token=${rawToken}`;
                    await sendPasswordResetEmail(email, resetUrl);
                } catch (error) {
                    // Never surface internal errors to the caller (avoids enumeration
                    // and keeps the UX identical for every email).
                    console.error("[requestPasswordReset] failed:", error);
                }
            }

            return {
                success: true,
                message:
                    "If an account exists for that email, a reset link has been sent.",
            };
        }),

    /**
     * Complete a password reset using the emailed token (public).
     */
    resetPassword: publicProcedure
        .input(
            z.object({
                token: z.string().min(1, "Reset token is required"),
                password: z
                    .string()
                    .min(6, "Password must be at least 6 characters"),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const tokenHash = hashResetToken(input.token.trim());
            const record = await ctx.db.passwordResetToken.findUnique({
                where: { tokenHash },
            });

            if (!record || record.usedAt || record.expiresAt < new Date()) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message:
                        "This reset link is invalid or has expired. Please request a new one.",
                });
            }

            const passwordHash = await hash(input.password, 12);

            await ctx.db.user.update({
                where: { id: record.userId },
                data: { passwordHash },
            });

            // Mark this token used and clear any other outstanding tokens.
            await ctx.db.passwordResetToken.updateMany({
                where: { userId: record.userId, usedAt: null },
                data: { usedAt: new Date() },
            });

            return { success: true, message: "Password updated. You can now sign in." };
        }),

    /**
     * Check if a mobile number is registered (public)
     */
    checkMobile: publicProcedure
        .input(z.object({ mobile: z.string().trim() }))
        .query(async ({ ctx, input }) => {
            const user = await ctx.db.user.findFirst({
                where: {
                    OR: [{ mobile: input.mobile }, { email: input.mobile }],
                },
                select: { id: true, name: true },
            });

            return { exists: !!user, name: user?.name ?? null };
        }),

    /**
     * Get current logged-in user profile (protected)
     */
    me: protectedProcedure.query(async ({ ctx }) => {
        const user = await ctx.db.user.findUnique({
            where: { id: ctx.session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                mobile: true,
                avatarUrl: true,
                creditBalance: true,
                role: true,
                createdAt: true,
            },
        });

        if (!user) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "User not found",
            });
        }

        return { ...user, isAdmin: isAdminAccount(user) };
    }),

    /** Credit prices + feature flags for the logged-in app UI. */
    productConfig: protectedProcedure.query(async () => {
        const [flags, costs] = await Promise.all([getFeatureFlags(), getCreditCosts()]);
        return { flags, costs };
    }),

    /**
     * Plan + credit balance + project usage for the dashboard / billing UI.
     */
    account: protectedProcedure.query(async ({ ctx }) => {
        return getAccountUsage(ctx.session.user.id);
    }),

    /**
     * Credit balance, plan context, and recent ledger activity.
     */
    creditActivity: protectedProcedure
        .input(
            z
                .object({
                    limit: z.number().int().min(1).max(100).default(50),
                })
                .optional(),
        )
        .query(async ({ ctx, input }) => {
            const limit = input?.limit ?? 50;
            const userId = ctx.session.user.id;
            const account = await getAccountUsage(userId);
            const plan = planById(account.planId);

            const entries = await ctx.db.creditLedger.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
                take: limit,
                select: {
                    id: true,
                    amount: true,
                    reason: true,
                    balanceAfter: true,
                    createdAt: true,
                },
            });

            return {
                creditBalance: account.creditBalance,
                planId: account.planId,
                planName: plan.name,
                monthlyCredits: account.monthlyCredits,
                subscriptionPeriodEnd: account.subscriptionPeriodEnd,
                subscriptionStatus: account.subscriptionStatus,
                entries: entries.map((row) => ({
                    id: row.id,
                    amount: row.amount,
                    category: creditReasonLabel(row.reason),
                    balanceAfter: row.balanceAfter,
                    createdAt: row.createdAt,
                })),
            };
        }),
});

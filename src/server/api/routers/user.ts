import { z } from "zod";
import { hash, compare } from "bcryptjs";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
    /**
     * Register a new user (public — no auth required)
     */
    register: publicProcedure
        .input(
            z.object({
                name: z.string().min(1, "Name is required").trim(),
                mobile: z.string().min(10, "Valid mobile number required").trim(),
                email: z.string().email("Invalid email").optional().or(z.literal("")),
                password: z.string().min(6, "Password must be at least 6 characters"),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { name, mobile, password } = input;
            const email = input.email?.trim().toLowerCase() || null;

            // Check for existing user
            const existing = await ctx.db.user.findFirst({
                where: {
                    OR: [
                        { mobile },
                        ...(email ? [{ email }] : []),
                    ],
                },
            });

            if (existing) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "An account with this mobile number or email already exists",
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
                createdAt: true,
            },
        });

        if (!user) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "User not found",
            });
        }

        return user;
    }),
});

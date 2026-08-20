import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "~/server/db";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, mobile, email, password } = body as {
            name: string;
            mobile?: string;
            email: string;
            password: string;
        };

        // Validate required fields
        if (!name?.trim() || !email?.trim() || !password?.trim()) {
            return NextResponse.json(
                { error: "Name, email, and password are required" },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: "Password must be at least 6 characters" },
                { status: 400 }
            );
        }

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedMobile = mobile?.trim() || null;

        // Check if email (or mobile) already exists
        const existingUser = await db.user.findFirst({
            where: {
                OR: [
                    { email: normalizedEmail },
                    ...(normalizedMobile ? [{ mobile: normalizedMobile }] : []),
                ],
            },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "An account with this email or mobile number already exists" },
                { status: 409 }
            );
        }

        // Hash password and create user
        const passwordHash = await hash(password, 12);
        const user = await db.user.create({
            data: {
                name: name.trim(),
                mobile: normalizedMobile,
                email: normalizedEmail,
                passwordHash,
            },
        });

        return NextResponse.json(
            { message: "Account created successfully", userId: user.id },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}

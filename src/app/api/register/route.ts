import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "~/server/db";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, mobile, email, password } = body as {
            name: string;
            mobile: string;
            email?: string;
            password: string;
        };

        // Validate required fields
        if (!name?.trim() || !mobile?.trim() || !password?.trim()) {
            return NextResponse.json(
                { error: "Name, mobile, and password are required" },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: "Password must be at least 6 characters" },
                { status: 400 }
            );
        }

        // Check if mobile already exists
        const existingUser = await db.user.findFirst({
            where: {
                OR: [
                    { mobile: mobile.trim() },
                    ...(email?.trim()
                        ? [{ email: email.trim().toLowerCase() }]
                        : []),
                ],
            },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "An account with this mobile number or email already exists" },
                { status: 409 }
            );
        }

        // Hash password and create user
        const passwordHash = await hash(password, 12);
        const user = await db.user.create({
            data: {
                name: name.trim(),
                mobile: mobile.trim(),
                email: email?.trim().toLowerCase() || null,
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

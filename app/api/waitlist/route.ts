import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const waitlistSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// GET - Get waitlist count
export async function GET() {
  try {
    const count = await prisma.waitlist.count();
    return NextResponse.json({ count }, { status: 200 });
  } catch (error) {
    console.error("Error fetching waitlist count:", error);
    return NextResponse.json(
      { error: "Failed to fetch waitlist count" },
      { status: 500 }
    );
  }
}

// POST - Add email to waitlist
export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { email } = waitlistSchema.parse(body);

    // Check if email already exists
    const existing = await prisma.waitlist.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This email is already on the waitlist" },
        { status: 409 }
      );
    }

    // Add to waitlist
    const waitlistEntry = await prisma.waitlist.create({
      data: {
        email: email.toLowerCase().trim(),
      },
    });

    return NextResponse.json(
      {
        message: "Successfully added to waitlist",
        id: waitlistEntry.id,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid email address" },
        { status: 400 }
      );
    }

    // Handle Prisma unique constraint error
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "This email is already on the waitlist" },
        { status: 409 }
      );
    }

    console.error("Error adding to waitlist:", error);
    return NextResponse.json(
      { error: "Failed to add to waitlist. Please try again." },
      { status: 500 }
    );
  }
}

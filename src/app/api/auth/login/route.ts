import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { z } from "zod";
import { authenticateUser } from "@/services/auth.service";
import { LoginSchema } from "@/lib/validators";

const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  tenantSlug: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = LoginRequestSchema.parse(body);

    const result = await authenticateUser(data);

    const response = NextResponse.json({
      success: true,
      user: result.user,
    });

    response.cookies.set("auth-token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("auth-token");
  return response;
}

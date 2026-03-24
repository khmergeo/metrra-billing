import { NextResponse } from "next/server";
import { z } from "zod";
import { CreateTenantSchema } from "@/lib/validators";
import { createTenant } from "@/services/tenant.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = CreateTenantSchema.parse(body);

    const result = await createTenant(data);

    return NextResponse.json({
      success: true,
      tenant: result.tenant,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Create tenant error:", error);
    return NextResponse.json(
      { error: "Failed to create tenant" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Tenant listing requires authentication" }, { status: 401 });
}

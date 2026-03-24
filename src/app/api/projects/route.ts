import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { withAuth } from "@/lib/middleware";
import { ProjectSchema } from "@/lib/validators";

export async function GET(
  request: Request,
  context: { tenantId: string }
) {
  return withAuth(request as unknown as NextRequest, async (req, ctx) => {
    const projects = await prisma.project.findMany({
      where: { tenantId: ctx.tenantId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ projects });
  });
}

export async function POST(
  request: Request,
  context: { tenantId: string }
) {
  return withAuth(request as unknown as NextRequest, async (req, ctx) => {
    try {
      const body = await request.json();
      const data = ProjectSchema.parse(body);

      const project = await prisma.project.create({
        data: {
          tenantId: ctx.tenantId,
          name: data.name,
          description: data.description,
        },
      });

      return NextResponse.json({ project });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: error.errors },
          { status: 400 }
        );
      }
      console.error("Create project error:", error);
      return NextResponse.json(
        { error: "Failed to create project" },
        { status: 500 }
      );
    }
  });
}

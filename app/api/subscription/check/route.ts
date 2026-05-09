import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const academyId = searchParams.get("academyId");

  if (!academyId) {
    return NextResponse.json({ hasAccess: false });
  }

  try {
    const sub = await prisma.subscription.findUnique({
      where: { academyId },
      select: { status: true, trialEndsAt: true, subscriptionEndsAt: true },
    });

    // Sin suscripción → sin acceso
    if (!sub) {
      return NextResponse.json({ hasAccess: false });
    }

    const now = new Date();

    if (sub.status === "TRIAL") {
      return NextResponse.json({ hasAccess: now <= sub.trialEndsAt });
    }

    if (sub.status === "ACTIVE") {
      return NextResponse.json({
        hasAccess: sub.subscriptionEndsAt ? now <= sub.subscriptionEndsAt : false,
      });
    }

    return NextResponse.json({ hasAccess: false });
  } catch {
    // Fail open — si hay error deja pasar
    return NextResponse.json({ hasAccess: true });
  }
}

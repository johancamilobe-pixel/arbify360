import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const academyId = req.nextUrl.searchParams.get("academyId");

  if (!academyId) {
    return NextResponse.json({ hasAccess: true }); // fail open
  }

  try {
    const sub = await prisma.subscription.findUnique({
      where: { academyId },
      select: { status: true, trialEndsAt: true, subscriptionEndsAt: true },
    });

    if (!sub) {
      // Si no tiene suscripción, dejar pasar (academia sin suscripción configurada aún)
      return NextResponse.json({ hasAccess: true });
    }

    const now = new Date();
    let hasAccess = false;

    if (sub.status === "TRIAL") {
      hasAccess = now <= sub.trialEndsAt;
    } else if (sub.status === "ACTIVE") {
      hasAccess = sub.subscriptionEndsAt ? now <= sub.subscriptionEndsAt : false;
    }

    return NextResponse.json({ hasAccess });
  } catch {
    return NextResponse.json({ hasAccess: true }); // fail open
  }
}

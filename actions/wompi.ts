"use server";

import { createHash } from "crypto";
import { requireAdminRole } from "@/lib/auth";

export async function generateWompiUrl(academyId: string): Promise<string> {
  await requireAdminRole(academyId);

  const publicKey    = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY!;
  const integrityKey = process.env.WOMPI_INTEGRITY_SECRET!;
  const amount       = 1000000; // 10.000 COP en centavos
  const currency     = "COP";
  const reference    = `${academyId}-${Date.now()}`;
  const redirectUrl  = `${process.env.NEXT_PUBLIC_APP_URL}/${academyId}`;

  // Calcular firma de integridad: SHA256(reference + amount + currency + secret)
  const toSign = `${reference}${amount}${currency}${integrityKey}`;
  const signature = createHash("sha256").update(toSign).digest("hex");

  const url = [
    `https://checkout.wompi.io/p/`,
    `?public-key=${publicKey}`,
    `&currency=${currency}`,
    `&amount-in-cents=${amount}`,
    `&reference=${reference}`,
    `&signature:integrity=${signature}`,
    `&redirect-url=${encodeURIComponent(redirectUrl)}`,
  ].join("");

  return url;
}

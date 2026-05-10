"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { confirmPayment } from "@/actions/subscription";

interface Props {
  academyId: string;
}

export function PaymentHandler({ academyId }: Props) {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const processed    = useRef(false);

  useEffect(() => {
    const payment = searchParams.get("payment");
    const ref     = searchParams.get("ref");

    // Wompi también envía id de transacción
    const transactionId = searchParams.get("id");

    if (payment === "done" && ref && !processed.current) {
      processed.current = true;

      async function process() {
        try {
          // Verificar con Wompi API si el pago fue aprobado
          let approved = false;

          if (transactionId) {
            const res = await fetch(
              `https://sandbox.wompi.co/v1/transactions/${transactionId}`
            );
            const data = await res.json();
            approved = data?.data?.status === "APPROVED";
          } else {
            // Sin transactionId, buscar por referencia
            const res = await fetch(
              `https://sandbox.wompi.co/v1/transactions?reference=${ref}`
            );
            const data = await res.json();
            approved = data?.data?.[0]?.status === "APPROVED";
          }

          if (approved) {
            await confirmPayment(academyId, ref!);
            // Limpiar URL y recargar
            router.replace(`/${academyId}/subscription`);
            router.refresh();
          }
        } catch (err) {
          console.error("Error verificando pago:", err);
        }
      }

      process();
    }
  }, [searchParams, academyId, router, transactionId]);

  return null;
}

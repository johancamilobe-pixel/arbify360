"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props {
  transactionId: string;
  academyId: string;
}

export function PaymentRefresh({ transactionId, academyId }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (!transactionId) return;

    // Pequeño delay para que el servidor termine de procesar
    const timer = setTimeout(() => {
      // Limpiar el ?id= de la URL y hacer hard refresh
      router.replace(`/${academyId}`);
      router.refresh();
    }, 1500);

    return () => clearTimeout(timer);
  }, [transactionId, academyId, router]);

  return null;
}

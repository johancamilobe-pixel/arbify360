"use client";

import { useEffect } from "react";

interface Props {
  transactionId: string;
  academyId: string;
}

export function PaymentRefresh({ transactionId, academyId }: Props) {
  useEffect(() => {
    if (!transactionId) return;

    // Esperar a que el servidor procese el pago y hacer hard reload
    const timer = setTimeout(() => {
      window.location.href = `/${academyId}`;
    }, 2000);

    return () => clearTimeout(timer);
  }, [transactionId, academyId]);

  return null;
}

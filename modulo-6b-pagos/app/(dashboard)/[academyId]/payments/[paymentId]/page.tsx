import { requireAdminRole } from "@/lib/auth";
import { getPaymentDetail } from "@/actions/payments";
import { redirect } from "next/navigation";
import { ReceiptView } from "./receipt-view";

interface Props {
  params: { academyId: string; paymentId: string };
}

export async function generateMetadata({ params }: Props) {
  return { title: "Detalle de pago" };
}

export default async function PaymentDetailPage({ params }: Props) {
  const { academyId, paymentId } = params;
  await requireAdminRole(academyId);

  const payment = await getPaymentDetail(academyId, paymentId);

  if (!payment) {
    redirect(`/${academyId}/payments`);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <ReceiptView payment={payment} academyId={academyId} />
    </div>
  );
}

import { redirect } from "next/navigation";
import { getDbUser, getUserAcademies } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";

// Este layout protege TODAS las rutas del dashboard.
// Verifica que el usuario esté autenticado y tenga al menos una academia.

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getDbUser();

  if (!user) {
    redirect("/sign-in");
  }

  const academies = await getUserAcademies();

  if (academies.length === 0) {
    redirect("/select-academy");
  }

  // El academyId real viene del layout de [academyId].
  // Este layout solo provee la estructura visual base.
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {children}
    </div>
  );
}

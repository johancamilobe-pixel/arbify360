import { redirect } from "next/navigation";
import { getUserAcademies } from "@/lib/auth";
import AcademySelector from "./academy-selector";
import { SignOutButton } from "@clerk/nextjs";

export const metadata = { title: "Seleccionar academia" };

export default async function SelectAcademyPage() {
  const academies = await getUserAcademies();

  // Sin membresías activas → mostrar pantalla de espera con botón de salir
  if (academies.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-brand-500 text-2xl">⏳</span>
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">
            Sin academia asignada
          </h1>
          <p className="text-muted-foreground mb-6">
            Aún no estás asignado a ninguna academia. Contacta al administrador
            de tu academia para que te agregue al sistema.
          </p>
          <SignOutButton redirectUrl="/sign-in">
            <button className="px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors">
              Cerrar sesión
            </button>
          </SignOutButton>
        </div>
      </main>
    );
  }

  // Una sola academia → redirigir directo al dashboard
  if (academies.length === 1) {
    redirect(`/${academies[0].academyId}`);
  }

  // Múltiples academias → mostrar selector
  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-semibold text-lg">ArbiFy360</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Selecciona tu academia
          </h1>
          <p className="text-muted-foreground">
            Perteneces a {academies.length} academias. ¿Con cuál deseas ingresar?
          </p>
        </div>

        {/* Lista de academias */}
        <AcademySelector academies={academies} />

        {/* Cerrar sesión */}
        <div className="mt-6 text-center">
          <SignOutButton redirectUrl="/sign-in">
            <button className="text-sm text-muted-foreground/70 hover:text-muted-foreground transition-colors">
              Cerrar sesión
            </button>
          </SignOutButton>
        </div>
      </div>
    </main>
  );
}
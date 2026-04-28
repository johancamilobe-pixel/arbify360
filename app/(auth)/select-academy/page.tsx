import { redirect } from "next/navigation";
import { getUserAcademies } from "@/lib/auth";
import AcademySelector from "./academy-selector";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { SignOutButton } from "./sign-out-button";

export const metadata = { title: "Seleccionar academia" };

export default async function SelectAcademyPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const academies = await getUserAcademies();

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
          <SignOutButton />
        </div>
      </main>
    );
  }

  if (academies.length === 1) {
    redirect(`/${academies[0].academyId}`);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
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

        <AcademySelector academies={academies} />

        <div className="mt-6 text-center">
          <SignOutButton variant="link" />
        </div>
      </div>
    </main>
  );
}
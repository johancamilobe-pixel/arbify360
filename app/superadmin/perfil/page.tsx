import { prisma } from "@/lib/prisma";
import { SuperAdminPerfilForm } from "./perfil-form";

export const metadata = { title: "SuperAdmin · Mi perfil" };

const SUPERADMIN_EMAIL = "johancamilobe@gmail.com";

export default async function SuperAdminPerfilPage() {
  const user = await prisma.user.findUnique({
    where: { email: SUPERADMIN_EMAIL },
  });

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mi perfil</h1>
        <p className="text-sm text-muted-foreground mt-1">Datos del Super Administrador</p>
      </div>

      <SuperAdminPerfilForm
        defaults={{
          firstName: user?.firstName ?? "",
          lastName:  user?.lastName ?? "",
          phone:     user?.phone ?? "",
        }}
      />
    </div>
  );
}

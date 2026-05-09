import { prisma } from "@/lib/prisma";
import { Users } from "lucide-react";

export const metadata = { title: "SuperAdmin · Usuarios" };

export default async function UsuariosPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      memberships: {
        include: { academy: true },
      },
    },
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Usuarios</h1>
        <p className="text-sm text-muted-foreground mt-1">{users.length} usuarios registrados</p>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border">
          <Users className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No hay usuarios</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Academias</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rol</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Registro</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {u.memberships.length > 0
                      ? u.memberships.map((m) => m.academy.name).join(", ")
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {u.memberships.map((m) => (
                      <span
                        key={m.id}
                        className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mr-1 ${
                          m.role === "ADMIN"
                            ? "bg-brand-100 text-brand-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {m.role === "ADMIN" ? "Admin" : "Árbitro"}
                      </span>
                    ))}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {u.createdAt.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

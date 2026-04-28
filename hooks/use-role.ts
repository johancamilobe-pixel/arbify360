"use client";

import { usePathname } from "next/navigation";

// En el cliente no tenemos acceso directo a la DB.
// El rol se pasa como prop desde el server component del layout.
// Este hook simplemente lee el academyId de la URL para construir rutas.

export function useAcademyId(): string | null {
  const pathname = usePathname();
  // La ruta siempre es /{academyId}/...
  const segments = pathname.split("/").filter(Boolean);
  return segments[0] ?? null;
}

import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rutas que NO requieren autenticación
const PUBLIC_PATHS = ["/sign-in", "/api/wompi"];

// Rutas que NO requieren verificación de suscripción
const SUBSCRIPTION_EXEMPT = [
  "/subscription",
  "/select-academy",
  "/sign-in",
  "/api/",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Dejar pasar rutas públicas
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // No autenticado → redirigir a sign-in
  if (!user && !pathname.startsWith("/sign-in")) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Verificar suscripción para rutas de academia
  // Patrón: /{academyId}/...
  const academyMatch = pathname.match(/^\/([^/]+)(\/.*)?$/);
  if (academyMatch && user) {
    const potentialAcademyId = academyMatch[1];

    // Ignorar rutas especiales
    const isExempt = SUBSCRIPTION_EXEMPT.some((exempt) =>
      pathname.includes(exempt)
    );

    if (!isExempt && potentialAcademyId !== "select-academy") {
      try {
        // Verificar suscripción directamente con DB via API interna
        const subCheckUrl = new URL(
          `/api/subscription/check?academyId=${potentialAcademyId}`,
          request.url
        );

        const subResponse = await fetch(subCheckUrl, {
          headers: { cookie: request.headers.get("cookie") ?? "" },
        });

        if (subResponse.ok) {
          const { hasAccess } = await subResponse.json();
          if (!hasAccess) {
            return NextResponse.redirect(
              new URL(`/${potentialAcademyId}/subscription`, request.url)
            );
          }
        }
      } catch {
        // Si falla la verificación, dejar pasar (fail open)
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

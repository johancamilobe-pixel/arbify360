import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// ─── Definición de rutas ───────────────────────────────────────────────────

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

const isSuperAdminRoute = createRouteMatcher([
  "/super-admin(.*)",
]);

const isDashboardRoute = createRouteMatcher([
  "/:academyId(.*)",
]);

// ─── Middleware principal ─────────────────────────────────────────────────

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  // 1. Rutas públicas — dejar pasar sin verificar
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // 2. Usuario no autenticado → redirigir al login
  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }

  // 3. Rutas de Super Admin — verificar rol en metadata de Clerk
  if (isSuperAdminRoute(req)) {
    const role = (sessionClaims?.publicMetadata as { role?: string })?.role;
    if (role !== "super_admin") {
      // No es super admin → redirigir al select de academia
      return NextResponse.redirect(new URL("/select-academy", req.url));
    }
  }

  // 4. Usuario autenticado en ruta válida → continuar
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Aplica a todas las rutas excepto archivos estáticos y _next
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

import { SignIn } from "@clerk/nextjs";

export const metadata = { title: "Iniciar sesión" };

export default function SignInPage() {
  return (
    <main className="min-h-screen flex">
      {/* Panel izquierdo — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-black flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="text-white font-semibold text-lg">ArbiFy360</span>
        </div>

        <div>
          <h1 className="text-white text-4xl font-bold leading-tight mb-4">
            Gestión profesional<br />
            <span className="text-brand-500">para árbitros</span>
          </h1>
          <p className="text-muted-foreground/70 text-lg">
            Programación, planillas y reportes en una sola plataforma.
          </p>
        </div>

        <p className="text-muted-foreground text-sm">
          © {new Date().getFullYear()} ArbiFy360
        </p>
      </div>

      {/* Panel derecho — Formulario de Clerk */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-card">
        {/* Logo visible solo en mobile */}
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="font-semibold text-lg">ArbiFy360</span>
        </div>

        <SignIn
          appearance={{
            elements: {
              rootBox: "w-full max-w-md",
              card: "shadow-none border border-border rounded-xl",
              headerTitle: "text-xl font-semibold",
              formButtonPrimary:
                "bg-brand-500 hover:bg-brand-600 text-white transition-colors",
            },
          }}
        />
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X, Building2, User } from "lucide-react";

export default function SignInPage() {
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Email o contraseña incorrectos");
      setLoading(false);
      return;
    }

    router.push("/select-academy");
    router.refresh();
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background isolate">
      <div className="bg-card border border-border rounded-xl p-8 w-full max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ArbiFy360</h1>
          <p className="text-muted-foreground text-sm mt-1">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg transition-colors disabled:opacity-70"
          >
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?{" "}
          <button
            onClick={() => setShowModal(true)}
            className="text-brand-500 hover:underline font-medium"
          >
            Regístrate
          </button>
        </p>
      </div>

      {/* Modal de selección */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm mx-4 space-y-5">
            {/* Header modal */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">Crear cuenta</h2>
                <p className="text-muted-foreground text-sm mt-0.5">¿Cómo quieres registrarte?</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Opciones */}
            <div className="space-y-3">
              <Link
                href="/register/academy"
                className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-brand-500 hover:bg-brand-50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center shrink-0 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">Registrar academia</p>
                  <p className="text-muted-foreground text-xs mt-0.5">Crea y administra tu academia de árbitros</p>
                </div>
              </Link>

              <Link
                href="/register"
                className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-brand-500 hover:bg-brand-50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center shrink-0 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">Soy árbitro</p>
                  <p className="text-muted-foreground text-xs mt-0.5">Solicita ingreso a una academia existente</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

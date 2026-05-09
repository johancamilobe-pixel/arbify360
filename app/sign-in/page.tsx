"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { X, Building2, User } from "lucide-react";

export default function SignInPage() {
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [mounted, setMounted]     = useState(false);
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (showModal) {
      // Pequeño delay para que la animación se vea
      requestAnimationFrame(() => setAnimateIn(true));
    } else {
      setAnimateIn(false);
    }
  }, [showModal]);

  function openModal() { setShowModal(true); }

  function closeModal() {
    setAnimateIn(false);
    setTimeout(() => setShowModal(false), 200);
  }

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

  const modal = (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: animateIn ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0)",
        backdropFilter: animateIn ? "blur(4px)" : "blur(0px)",
        transition: "background-color 200ms ease, backdrop-filter 200ms ease",
      }}
    >
      <div
        style={{
          backgroundColor: "hsl(220, 14%, 20%)",
          border: "1px solid hsl(220, 12%, 32%)",
          transform: animateIn ? "scale(1) translateY(0)" : "scale(0.95) translateY(16px)",
          opacity: animateIn ? 1 : 0,
          transition: "transform 200ms ease, opacity 200ms ease",
        }}
        className="rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-foreground">Crear cuenta</h2>
            <p className="text-muted-foreground text-sm mt-0.5">¿Cómo quieres registrarte?</p>
          </div>
          <button
            onClick={closeModal}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Opciones */}
        <div className="space-y-3">
          <button
            onClick={() => window.location.href = "/register/academy"}
            style={{ backgroundColor: "hsl(220, 14%, 26%)", border: "1px solid hsl(220, 12%, 32%)" }}
            className="w-full flex items-center gap-4 p-4 rounded-xl hover:border-brand-500 transition-all hover:scale-[1.01] text-left group"
          >
            <div className="w-11 h-11 rounded-xl bg-brand-500 text-white flex items-center justify-center shrink-0 shadow-lg group-hover:bg-brand-600 transition-colors">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Registrar academia</p>
              <p className="text-muted-foreground text-xs mt-0.5">Crea y administra tu academia de árbitros</p>
            </div>
          </button>

          <button
            onClick={() => window.location.href = "/register"}
            style={{ backgroundColor: "hsl(220, 14%, 26%)", border: "1px solid hsl(220, 12%, 32%)" }}
            className="w-full flex items-center gap-4 p-4 rounded-xl hover:border-brand-500 transition-all hover:scale-[1.01] text-left group"
          >
            <div className="w-11 h-11 rounded-xl bg-brand-500 text-white flex items-center justify-center shrink-0 shadow-lg group-hover:bg-brand-600 transition-colors">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Soy árbitro</p>
              <p className="text-muted-foreground text-xs mt-0.5">Solicita ingreso a una academia existente</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
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
              className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-white text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
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
              className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-white text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
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
            onClick={openModal}
            className="text-brand-500 hover:underline font-medium"
          >
            Regístrate
          </button>
        </p>
      </div>

      {mounted && showModal && createPortal(modal, document.body)}
    </div>
  );
}

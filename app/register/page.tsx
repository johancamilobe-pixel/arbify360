"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createAcademyWithAdmin } from "@/actions/register-academy";

export default function RegisterAcademyPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const [form, setForm] = useState({
    // Datos de la academia
    academyName: "",
    // Datos del admin
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    const result = await createAcademyWithAdmin({
      academyName: form.academyName,
      firstName:   form.firstName,
      lastName:    form.lastName,
      email:       form.email,
      password:    form.password,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // Redirigir al login para que inicie sesión
    router.push(`/sign-in?registered=1`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-10">
      <div className="bg-card border border-border rounded-xl p-8 w-full max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ArbiFy360</h1>
          <p className="text-muted-foreground text-sm mt-1">Registra tu academia</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Datos de la academia */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Datos de la academia
            </p>
            <div>
              <label className="text-sm font-medium text-foreground">Nombre de la academia</label>
              <input
                type="text"
                name="academyName"
                value={form.academyName}
                onChange={handleChange}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-white text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Academia de Árbitros XYZ"
                required
              />
            </div>
          </div>

          {/* Datos del administrador */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Tu cuenta de administrador
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground">Nombres</label>
                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-white text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Johan"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Apellidos</label>
                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-white text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Camilo"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-white text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Contraseña</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-white text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Confirmar contraseña</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-white text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg transition-colors disabled:opacity-70"
          >
            {loading ? "Creando academia..." : "Crear academia"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link href="/sign-in" className="text-brand-500 hover:underline font-medium">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

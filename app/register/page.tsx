"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createRefereeRequest } from "@/actions/referee-requests";

interface Academy {
  id: string;
  name: string;
}

export default function RegisterPage() {
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [loadingAcademies, setLoadingAcademies] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    documentNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
    academyId: "",
  });

  const router = useRouter();

  useEffect(() => {
    async function loadAcademies() {
      try {
        const res = await fetch("/api/academies", { cache: "no-store" });
        const data = await res.json();
        setAcademies(data);
      } catch {
        setError("No se pudieron cargar las academias");
      } finally {
        setLoadingAcademies(false);
      }
    }
    loadAcademies();
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
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

    if (!form.academyId) {
      setError("Debes seleccionar una academia");
      return;
    }

    setLoading(true);

    const result = await createRefereeRequest({
      academyId: form.academyId,
      firstName: form.firstName,
      lastName: form.lastName,
      documentNumber: form.documentNumber,
      email: form.email,
      password: form.password,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="bg-card border border-border rounded-xl p-8 w-full max-w-md space-y-6 text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">¡Solicitud enviada!</h2>
            <p className="text-muted-foreground text-sm mt-2">
              Tu solicitud fue enviada al administrador de la academia. Te notificarán cuando sea aceptada.
            </p>
          </div>
          <Link
            href="/sign-in"
            className="block w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg transition-colors text-center"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-10">
      <div className="bg-card border border-border rounded-xl p-8 w-full max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ArbiFy360</h1>
          <p className="text-muted-foreground text-sm mt-1">Crea tu cuenta como árbitro</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Nombres */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground">Nombres</label>
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Carlos"
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
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Pérez"
                required
              />
            </div>
          </div>

          {/* Número de CC */}
          <div>
            <label className="text-sm font-medium text-foreground">Número de cédula</label>
            <input
              type="text"
              name="documentNumber"
              value={form.documentNumber}
              onChange={handleChange}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="1234567890"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium text-foreground">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="tu@email.com"
              required
            />
          </div>

          {/* Contraseña */}
          <div>
            <label className="text-sm font-medium text-foreground">Contraseña</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="••••••••"
              required
            />
          </div>

          {/* Confirmar contraseña */}
          <div>
            <label className="text-sm font-medium text-foreground">Confirmar contraseña</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="••••••••"
              required
            />
          </div>

          {/* Academia */}
          <div>
            <label className="text-sm font-medium text-foreground">Academia</label>
            <select
              name="academyId"
              value={form.academyId}
              onChange={handleChange}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            >
              <option value="">
                {loadingAcademies ? "Cargando academias..." : "Selecciona una academia"}
              </option>
              {academies.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || loadingAcademies}
            className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg transition-colors disabled:opacity-70"
          >
            {loading ? "Enviando solicitud..." : "Solicitar ingreso"}
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

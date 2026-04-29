"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { createIncome, deleteIncome } from "@/actions/payments";
import type { IncomeRecord } from "@/actions/payments";
import { toast } from "sonner";

interface Props {
  academyId: string;
  incomes: IncomeRecord[];
}

const SOURCE_OPTIONS = [
  { value: "TEAM", label: "Equipo" },
  { value: "CLUB", label: "Club" },
  { value: "LEAGUE", label: "Liga" },
] as const;

const METHOD_OPTIONS = [
  { value: "CASH", label: "Efectivo" },
  { value: "BANK_TRANSFER", label: "Transferencia" },
  { value: "NEQUI", label: "Nequi" },
  { value: "DAVIPLATA", label: "Daviplata" },
] as const;

const SOURCE_LABELS: Record<string, string> = {
  TEAM: "Equipo",
  CLUB: "Club",
  LEAGUE: "Liga",
};

const METHOD_LABELS: Record<string, string> = {
  CASH: "Efectivo",
  BANK_TRANSFER: "Transferencia",
  NEQUI: "Nequi",
  DAVIPLATA: "Daviplata",
};

export function IncomesList({ academyId, incomes }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [source, setSource] = useState<string>("TEAM");
  const [sourceName, setSourceName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CASH");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  function resetForm() {
    setSource("TEAM");
    setSourceName("");
    setDescription("");
    setAmount("");
    setMethod("CASH");
    setDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setShowForm(false);
  }

  async function handleSubmit() {
    if (!sourceName.trim() || !amount) {
      toast.error("Completa los campos requeridos");
      return;
    }

    setLoading(true);
    try {
      const result = await createIncome(academyId, {
        source: source as any,
        sourceName: sourceName.trim(),
        description: description.trim() || undefined,
        amount: parseFloat(amount),
        method: method as any,
        date,
        notes: notes.trim() || undefined,
      });

      if (result.success) {
        toast.success("Ingreso registrado");
        resetForm();
        router.refresh();
      } else {
        toast.error(result.error || "Error al registrar");
      }
    } catch {
      toast.error("Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este ingreso?")) return;

    setDeleting(id);
    try {
      const result = await deleteIncome(academyId, id);
      if (result.success) {
        toast.success("Ingreso eliminado");
        router.refresh();
      } else {
        toast.error(result.error || "Error al eliminar");
      }
    } catch {
      toast.error("Error inesperado");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      {/* Botón agregar */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
        >
          {showForm ? "Cancelar" : "+ Registrar ingreso"}
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-card rounded-xl border border-border p-5 mb-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Nuevo ingreso
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Fuente */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Tipo de fuente *
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {SOURCE_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Nombre */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Nombre del {SOURCE_LABELS[source]?.toLowerCase() || "origen"} *
              </label>
              <input
                type="text"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                placeholder={`Ej: ${source === "LEAGUE" ? "Liga Municipal" : source === "CLUB" ? "Club Deportivo" : "Equipo Los Tigres"}`}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Descripción */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Descripción
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Pago torneo abril 2026"
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Monto */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Monto (COP) *
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Método */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Método de pago *
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {METHOD_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Fecha *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Notas */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Notas
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas adicionales..."
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar ingreso"}
            </button>
          </div>
        </div>
      )}

      {/* Lista de ingresos */}
      {incomes.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-muted-foreground">
            No hay ingresos registrados en este período
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Fuente
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Nombre
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Descripción
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Método
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                    Monto
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                    Fecha
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {incomes.map((income) => (
                  <tr
                    key={income.id}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {SOURCE_LABELS[income.source] || income.source}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground font-medium">
                      {income.sourceName}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {income.description || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {METHOD_LABELS[income.method] || income.method}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-green-700">
                      {formatCurrency(income.amount)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(income.date)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(income.id)}
                        disabled={deleting === income.id}
                        className="text-xs text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                      >
                        {deleting === income.id ? "..." : "Eliminar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

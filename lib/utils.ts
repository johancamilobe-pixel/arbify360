import { Decimal } from "@prisma/client/runtime/library";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" }) + " · " + d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

export function formatCurrency(value?: Decimal | string | number | null) {
  if (!value) return "—";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(Number(value));
}

export const GAME_ROLE_LABELS: Record<string, string> = {
  MAIN_REFEREE:      "Árbitro principal",
  SECONDARY_REFEREE: "Árbitro secundario",
  TABLE_ASSISTANT:   "Asistente de mesa",
};

export const GAME_STATUS_LABELS: Record<string, string> = {
  SCHEDULED:  "Programado",
  CONFIRMED:  "Confirmado",
  FINISHED:   "Finalizado",
  CANCELLED:  "Cancelado",
};

export const SUBMISSION_STATUS_LABELS: Record<string, string> = {
  PENDING:  "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
};

export function getGameStatusColor(status: string): string {
  const colors: Record<string, string> = {
    SCHEDULED:  "bg-blue-100 text-blue-800",
    CONFIRMED:  "bg-green-100 text-green-800",
    FINISHED:   "bg-muted text-foreground",
    CANCELLED:  "bg-red-100 text-red-800",
  };
  return colors[status] ?? "bg-muted text-foreground";
}

export function getSubmissionStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING:  "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };
  return colors[status] ?? "bg-muted text-foreground";
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}
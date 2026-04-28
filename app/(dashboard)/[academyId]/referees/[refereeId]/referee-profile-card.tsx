"use client";

import { Phone, FileText, Mail, CreditCard, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileData {
  name:           string;
  photoUrl:       string | null;
  email:          string;
  phone:          string | null;
  phone2:         string | null;
  documentType:   string | null;
  documentNumber: string | null;
  birthDate:      string | null;
  age:            number | null;
  licenseNumber:  string | null;
  categoryName:   string | null;
  isActive:       boolean;
  ratePerGame:    string | null;
}

interface StatsData {
  total:       number;
  thisMonth:   number;
  totalEarned: string;
}

interface HistoryItem {
  id:            string;
  homeTeam:      string;
  awayTeam:      string;
  startTime:     string;
  role:          string;
  status:        string;
  statusLabel:   string;
  statusColor:   string;
  paymentAmount: string | null;
}

interface Props {
  profile: ProfileData;
  stats:   StatsData;
  history: HistoryItem[];
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  CC:        "C.C.",
  TI:        "T.I.",
  CE:        "C.E.",
  PASAPORTE: "Pasaporte",
  OTRO:      "Otro",
};

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export function RefereeProfileCard({ profile, stats, history }: Props) {
  return (
    <>
      {/* Header */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {profile.photoUrl ? (
              <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-brand-600 font-bold text-xl">{getInitials(profile.name)}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h1 className="text-xl font-bold text-foreground">{profile.name}</h1>
                {profile.categoryName && (
                  <span className="text-sm text-brand-600 font-medium">{profile.categoryName}</span>
                )}
              </div>
              <span className={cn(
                "text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0",
                profile.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
              )}>
                {profile.isActive ? "Activo" : "Inactivo"}
              </span>
            </div>

            <div className="mt-3 space-y-1.5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-3.5 h-3.5" />{profile.email}
              </div>
              {profile.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-3.5 h-3.5" />
                  <span className="text-muted-foreground/70 text-xs">Tel 1:</span>{profile.phone}
                </div>
              )}
              {profile.phone2 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-3.5 h-3.5" />
                  <span className="text-muted-foreground/70 text-xs">Tel 2:</span>{profile.phone2}
                </div>
              )}
              {profile.documentType && profile.documentNumber && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CreditCard className="w-3.5 h-3.5" />
                  {DOCUMENT_TYPE_LABELS[profile.documentType] ?? profile.documentType} {profile.documentNumber}
                </div>
              )}
              {profile.birthDate && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  {profile.birthDate}{profile.age !== null ? ` (${profile.age} años)` : ""}
                </div>
              )}
              {profile.licenseNumber && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="w-3.5 h-3.5" />Licencia: {profile.licenseNumber}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Juegos totales" value={stats.total} />
        <StatCard label="Juegos este mes" value={stats.thisMonth} />
        <StatCard label="Total ganado" value={stats.totalEarned} highlight />
      </div>

      {/* Tarifa */}
      {profile.ratePerGame && (
        <div className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Tarifa por juego (según categoría)</span>
          <span className="text-brand-600 font-bold text-lg">{profile.ratePerGame}</span>
        </div>
      )}

      {/* Historial */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h2 className="font-semibold text-foreground mb-4">Historial de juegos</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground/70">Ningún juego asignado aún</p>
        ) : (
          <div className="space-y-3">
            {history.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{a.homeTeam} vs {a.awayTeam}</p>
                  <p className="text-xs text-muted-foreground/70">{a.startTime} · {a.role}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {a.paymentAmount && (
                    <span className="text-xs text-green-600 font-semibold">{a.paymentAmount}</span>
                  )}
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", a.statusColor)}>
                    {a.statusLabel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={cn(
      "rounded-xl border p-4 text-center",
      highlight ? "bg-brand-500 border-brand-500" : "bg-card border-border"
    )}>
      <p className={cn("text-xl font-bold", highlight ? "text-white" : "text-foreground")}>{value}</p>
      <p className={cn("text-xs mt-1", highlight ? "text-white/80" : "text-muted-foreground/70")}>{label}</p>
    </div>
  );
}

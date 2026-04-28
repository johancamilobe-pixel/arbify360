"use client";

import { useState, useRef, useTransition } from "react";
import { importReferees, type ImportRow, type ImportResult } from "@/actions/import-referees";
import { Upload, Download, CheckCircle, XCircle, AlertCircle, Loader2, FileSpreadsheet, X } from "lucide-react";
import * as XLSX from "xlsx";

interface Props {
  academyId: string;
}

interface PreviewRow extends ImportRow {
  _valid: boolean;
  _errors: string[];
}

type Step = "upload" | "preview" | "done";

export function RefereeImporter({ academyId }: Props) {
  const [step, setStep]           = useState<Step>("upload");
  const [preview, setPreview]     = useState<PreviewRow[]>([]);
  const [results, setResults]     = useState<ImportResult[]>([]);
  const [summary, setSummary]     = useState<{ created: number; updated: number; errors: number } | null>(null);
  const [fileName, setFileName]   = useState("");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  // ─── Leer Excel ────────────────────────────────────────────────────────────

  function handleFile(file: File) {
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const wb   = XLSX.read(data, { type: "array", cellDates: true });
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, {
        header: 1,
        range:  2, // empieza desde fila 3 (índice 2), saltando título + encabezado
        defval: "",
      }) as any[][];

      const parsed: PreviewRow[] = rows
        .filter((r) => r.some((v: any) => String(v).trim() !== ""))
        .slice(0, 500)
        .map((r, i) => {
          const firstName      = String(r[0] ?? "").trim();
          const lastName       = String(r[1] ?? "").trim();
          const email          = String(r[2] ?? "").trim();
          const documentType   = String(r[3] ?? "").trim() || undefined;
          const documentNumber = String(r[4] ?? "").trim() || undefined;
          const rawDate        = r[5];
          const birthDate      = rawDate instanceof Date
            ? rawDate.toISOString().slice(0, 10)
            : String(rawDate ?? "").trim() || undefined;
          const phone          = String(r[6] ?? "").trim() || undefined;
          const phone2         = String(r[7] ?? "").trim() || undefined;
          const licenseNumber  = String(r[8] ?? "").trim() || undefined;
          const ratePerGame    = String(r[9] ?? "").trim() || undefined;

          const errors: string[] = [];
          if (!firstName)                       errors.push("Nombres requeridos");
          if (!lastName)                        errors.push("Apellidos requeridos");
          if (!email)                           errors.push("Email requerido");
          else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Email inválido");

          return {
            rowNumber: i + 4, // fila real en el Excel (1=título, 2=encabezado, 3=ejemplo, 4+=datos)
            firstName, lastName, email,
            documentType, documentNumber, birthDate,
            phone, phone2, licenseNumber, ratePerGame,
            _valid:  errors.length === 0,
            _errors: errors,
          };
        });

      setPreview(parsed);
      setStep("preview");
    };
    reader.readAsArrayBuffer(file);
  }

  // ─── Importar ───────────────────────────────────────────────────────────────

  function handleImport() {
    const validRows = preview.filter((r) => r._valid);
    startTransition(async () => {
      const { results: res, summary: sum } = await importReferees(academyId, validRows);
      setResults(res);
      setSummary(sum);
      setStep("done");
    });
  }

  // ─── Reset ──────────────────────────────────────────────────────────────────

  function handleReset() {
    setStep("upload");
    setPreview([]);
    setResults([]);
    setSummary(null);
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
  }

  const validCount   = preview.filter((r) => r._valid).length;
  const invalidCount = preview.filter((r) => !r._valid).length;

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-brand-500" />
          <h2 className="font-semibold text-foreground">Importar árbitros desde Excel</h2>
        </div>

        {/* Descargar plantilla */}
        <a
          href={`/${academyId}/referees/import/template`}
          className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Descargar plantilla
        </a>
      </div>

      {/* ── PASO 1: Upload ── */}
      {step === "upload" && (
        <div
          className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-brand-300 hover:bg-brand-50/30 transition-colors"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
        >
          <Upload className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            Arrastra el archivo aquí o <span className="text-brand-600">haz clic para seleccionar</span>
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">Archivos .xlsx o .xls — máximo 500 árbitros</p>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>
      )}

      {/* ── PASO 2: Preview ── */}
      {step === "preview" && (
        <div className="space-y-4">
          {/* Resumen de lectura */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{fileName}</span>
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                {preview.length} filas
              </span>
              {validCount > 0 && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  {validCount} válidas
                </span>
              )}
              {invalidCount > 0 && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                  {invalidCount} con errores
                </span>
              )}
            </div>
            <button onClick={handleReset} className="text-muted-foreground/70 hover:text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabla preview */}
          <div className="overflow-x-auto rounded-lg border border-border max-h-80 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-background sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-muted-foreground font-medium w-8">#</th>
                  <th className="px-3 py-2 text-left text-muted-foreground font-medium">Nombres</th>
                  <th className="px-3 py-2 text-left text-muted-foreground font-medium">Apellidos</th>
                  <th className="px-3 py-2 text-left text-muted-foreground font-medium">Email</th>
                  <th className="px-3 py-2 text-left text-muted-foreground font-medium">Documento</th>
                  <th className="px-3 py-2 text-left text-muted-foreground font-medium">Teléfono</th>
                  <th className="px-3 py-2 text-left text-muted-foreground font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {preview.map((row) => (
                  <tr key={row.rowNumber} className={row._valid ? "bg-card" : "bg-red-50"}>
                    <td className="px-3 py-2 text-muted-foreground/70">{row.rowNumber}</td>
                    <td className="px-3 py-2 text-foreground/80">{row.firstName || <span className="text-red-400">—</span>}</td>
                    <td className="px-3 py-2 text-foreground/80">{row.lastName  || <span className="text-red-400">—</span>}</td>
                    <td className="px-3 py-2 text-foreground/80">{row.email     || <span className="text-red-400">—</span>}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.documentType && row.documentNumber
                        ? `${row.documentType} ${row.documentNumber}`
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{row.phone || "—"}</td>
                    <td className="px-3 py-2">
                      {row._valid ? (
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <span className="text-red-500" title={row._errors.join(", ")}>
                          <AlertCircle className="w-3.5 h-3.5 inline" /> {row._errors[0]}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Botones */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-foreground/80 bg-card border border-border rounded-lg hover:bg-background transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleImport}
              disabled={isPending || validCount === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors disabled:opacity-70"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isPending
                ? "Importando..."
                : `Importar ${validCount} árbitro${validCount !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      )}

      {/* ── PASO 3: Resultados ── */}
      {step === "done" && summary && (
        <div className="space-y-4">
          {/* Resumen */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-green-50 rounded-lg p-3 text-center border border-green-100">
              <p className="text-2xl font-bold text-green-600">{summary.created}</p>
              <p className="text-xs text-green-600">Creados</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-100">
              <p className="text-2xl font-bold text-blue-600">{summary.updated}</p>
              <p className="text-xs text-blue-600">Actualizados</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center border border-red-100">
              <p className="text-2xl font-bold text-red-500">{summary.errors}</p>
              <p className="text-xs text-red-500">Errores</p>
            </div>
          </div>

          {/* Detalle de errores si los hay */}
          {summary.errors > 0 && (
            <div className="rounded-lg border border-red-200 overflow-hidden">
              <div className="bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                Filas con error
              </div>
              <div className="divide-y divide-red-100">
                {results.filter((r) => r.status === "error").map((r) => (
                  <div key={r.rowNumber} className="flex items-center gap-3 px-3 py-2 bg-card">
                    <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                    <span className="text-xs text-muted-foreground w-8">F{r.rowNumber}</span>
                    <span className="text-xs text-foreground/80 flex-1">{r.name || r.email}</span>
                    <span className="text-xs text-red-500">{r.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-foreground/80 bg-card border border-border rounded-lg hover:bg-background transition-colors"
            >
              Importar otro archivo
            </button>
            <a
              href={`/${academyId}/referees`}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors"
            >
              Ver árbitros
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

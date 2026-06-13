"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { CsvImportRowResult, CsvImportResult } from "@/modules/lead-source/csv-import";

import { importCsvAction, type ImportCsvState } from "./actions";

const initialState: ImportCsvState = {};

const ROW_LABELS: Record<CsvImportRowResult["status"], string> = {
  created: "Created",
  skipped_duplicate: "Duplicate",
  skipped_suppressed: "Suppressed",
  error: "Error",
};

const ROW_COLORS: Record<CsvImportRowResult["status"], string> = {
  created: "text-emerald-400",
  skipped_duplicate: "text-amber-400",
  skipped_suppressed: "text-amber-400",
  error: "text-red-400",
};

export function ImportCsvForm() {
  const [state, formAction, pending] = useActionState(importCsvAction, initialState);

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="file">CSV file</Label>
          <input
            id="file"
            name="file"
            type="file"
            accept=".csv,text/csv"
            className="block w-full text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-white/20"
          />
        </div>

        <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted">
          <div className="h-px flex-1 bg-white/10" />
          or paste CSV
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="csvText">CSV text</Label>
          <Textarea
            id="csvText"
            name="csvText"
            rows={8}
            placeholder="businessName,industry,websiteUrl,contactEmail,contactPhone,contactPerson,city,country,notes"
            className="font-mono text-xs"
          />
        </div>

        {state?.error && (
          <p role="alert" className="text-sm text-red-400">
            {state.error}
          </p>
        )}

        <Button type="submit" disabled={pending}>
          {pending ? "Importing..." : "Import leads"}
        </Button>
      </form>

      {state?.result && <ImportResultSummary result={state.result} />}
    </div>
  );
}

function ImportResultSummary({ result }: { result: CsvImportResult }) {
  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total rows" value={result.total} />
        <Stat label="Created" value={result.created} accent="text-emerald-400" />
        <Stat label="Skipped" value={result.skipped} accent="text-amber-400" />
        <Stat label="Errors" value={result.errors} accent="text-red-400" />
      </div>

      {result.rows.length > 0 && (
        <div className="max-h-96 space-y-1 overflow-y-auto text-sm">
          {result.rows.map((row) => (
            <div
              key={row.row}
              className="flex items-center justify-between gap-3 border-b border-white/5 py-1.5 last:border-0"
              title={row.message}
            >
              <span className="text-muted">Row {row.row}</span>
              <span className="flex-1 truncate text-white">{row.businessName || "—"}</span>
              <span className={cn("shrink-0 text-xs font-medium", ROW_COLORS[row.status])}>{ROW_LABELS[row.status]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className={cn("text-xl font-bold text-white", accent)}>{value}</p>
    </div>
  );
}

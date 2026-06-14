"use client";

import { useActionState } from "react";
import { Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

import { startBatchAction, type StartBatchState } from "./actions";

const initialState: StartBatchState = {};

const OPERATIONS = [
  { value: "full_pipeline", label: "Full pipeline (qualify → crawl → audit)" },
  { value: "preview", label: "Generate previews (+ QC)" },
  { value: "email", label: "Draft outreach emails (+ QC)" },
];

/** Start a controlled batch run of an operation across eligible leads. */
export function StartBatchForm() {
  const [state, formAction, pending] = useActionState(startBatchAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="operation">Operation</Label>
          <Select id="operation" name="operation" defaultValue="full_pipeline">
            {OPERATIONS.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="batchSize">Batch size</Label>
          <Input id="batchSize" name="batchSize" type="number" min={1} max={50} defaultValue={10} />
        </div>
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      )}
      {state?.summary && (
        <p className="text-sm text-emerald-400">
          {state.summary.operation.replace(/_/g, " ")}: processed {state.summary.processed} — {state.summary.succeeded}{" "}
          succeeded, {state.summary.failed} failed.
        </p>
      )}

      <Button type="submit" disabled={pending}>
        <Play className="size-4" />
        {pending ? "Running batch..." : "Start batch"}
      </Button>
      <p className="text-xs text-muted">
        Runs sequentially with a rate-limit delay. Default batch size 10, max 50. Suppressed leads are skipped.
      </p>
    </form>
  );
}

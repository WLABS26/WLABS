"use client";

import { useActionState } from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

import { runPipelineAction, type RunPipelineState } from "./actions";

const initialState: RunPipelineState = {};

/**
 * Triggers the full internal agent pipeline (qualify → crawl → audit) for a
 * lead and surfaces the outcome inline.
 */
export function RunPipelineForm({ leadId, slug }: { leadId: string; slug: string }) {
  const [state, formAction, pending] = useActionState(runPipelineAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="leadId" value={leadId} />
      <input type="hidden" name="slug" value={slug} />

      <p className="text-sm text-muted">
        Runs the Lead Qualification, Website Crawl, and Website Audit agents in sequence and records the run.
      </p>

      {state?.error && (
        <p role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      )}
      {state?.success && state.message && <p className="text-sm text-emerald-400">{state.message}</p>}

      <Button type="submit" size="sm" className="w-full" disabled={pending}>
        <Sparkles className="size-4" />
        {pending ? "Running pipeline..." : "Run agent pipeline"}
      </Button>
    </form>
  );
}

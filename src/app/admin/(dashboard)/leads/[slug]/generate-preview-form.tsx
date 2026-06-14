"use client";

import { useActionState } from "react";
import { ExternalLink, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { generatePreviewAction, type GeneratePreviewState } from "./actions";

const initialState: GeneratePreviewState = {};

/** Generates the preview homepage concept and links to the rendered preview. */
export function GeneratePreviewForm({ leadId, slug }: { leadId: string; slug: string }) {
  const [state, formAction, pending] = useActionState(generatePreviewAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="leadId" value={leadId} />
      <input type="hidden" name="slug" value={slug} />

      <p className="text-sm text-muted">
        Runs the Redesign Strategy and Preview Generation agents and creates a shareable preview homepage.
      </p>

      {state?.error && (
        <p role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      )}
      {state?.success && state.previewUrl && (
        <a
          href={state.previewUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-brand-cyan hover:underline"
        >
          Preview ready — open it
          <ExternalLink className="size-3.5" />
        </a>
      )}

      <Button type="submit" size="sm" variant="outline" className="w-full" disabled={pending}>
        <Wand2 className="size-4" />
        {pending ? "Generating preview..." : "Generate preview"}
      </Button>
    </form>
  );
}

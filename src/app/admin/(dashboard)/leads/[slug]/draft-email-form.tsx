"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { EMAIL_VARIANTS } from "@/modules/shared/types";

import { draftEmailAction, type DraftEmailState } from "../../actions";

const initialState: DraftEmailState = {};

function humanizeVariant(variant: string) {
  return variant.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Drafts an outreach email (with QC) for the lead, choosing the variant. */
export function DraftEmailForm({ leadId, slug }: { leadId: string; slug: string }) {
  const [state, formAction, pending] = useActionState(draftEmailAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="leadId" value={leadId} />
      <input type="hidden" name="slug" value={slug} />

      <Select name="variant" defaultValue="direct_preview" aria-label="Email variant">
        {EMAIL_VARIANTS.map((variant) => (
          <option key={variant} value={variant}>
            {humanizeVariant(variant)}
          </option>
        ))}
      </Select>

      {state?.error && (
        <p role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="text-sm text-emerald-400">Draft created — QC {state.qcStatus?.replace(/_/g, " ")}.</p>
      )}

      <Button type="submit" size="sm" variant="outline" className="w-full" disabled={pending}>
        <Mail className="size-4" />
        {pending ? "Drafting..." : "Draft outreach email"}
      </Button>
    </form>
  );
}

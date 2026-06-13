"use client";

import { useActionState } from "react";

import { humanizeStatus } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { LEAD_STATUSES, type LeadStatus } from "@/modules/shared/types";

import { updateLeadStatusAction, type UpdateStatusState } from "./actions";

const initialState: UpdateStatusState = {};

export function LeadStatusForm({ leadId, slug, status }: { leadId: string; slug: string; status: LeadStatus }) {
  const [state, formAction, pending] = useActionState(updateLeadStatusAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="leadId" value={leadId} />
      <input type="hidden" name="slug" value={slug} />

      <Select name="status" defaultValue={status} aria-label="Lead status">
        {LEAD_STATUSES.map((value) => (
          <option key={value} value={value}>
            {humanizeStatus(value)}
          </option>
        ))}
      </Select>

      {state?.error && (
        <p role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      )}
      {state?.success && <p className="text-sm text-emerald-400">Status updated.</p>}

      <Button type="submit" size="sm" className="w-full" disabled={pending}>
        {pending ? "Updating..." : "Update status"}
      </Button>
    </form>
  );
}

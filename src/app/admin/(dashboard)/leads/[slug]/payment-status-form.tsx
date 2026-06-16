"use client";

import { useActionState } from "react";

import { humanizeStatus } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { PAYMENT_STATUSES, type PaymentStatus } from "@/modules/shared/types";

import { updatePaymentStatusAction, type UpdatePaymentStatusState } from "./actions";

const initialState: UpdatePaymentStatusState = {};

export function PaymentStatusForm({ leadId, slug, paymentStatus }: { leadId: string; slug: string; paymentStatus: PaymentStatus }) {
  const [state, formAction, pending] = useActionState(updatePaymentStatusAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="leadId" value={leadId} />
      <input type="hidden" name="slug" value={slug} />

      <Select name="paymentStatus" defaultValue={paymentStatus} aria-label="Payment status">
        {PAYMENT_STATUSES.map((value) => (
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
      {state?.success && <p className="text-sm text-emerald-400">Payment status updated.</p>}

      <Button type="submit" size="sm" className="w-full" disabled={pending}>
        {pending ? "Updating..." : "Update payment status"}
      </Button>
    </form>
  );
}

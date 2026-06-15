"use client";

import type { ReactNode } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { deleteLeadAction } from "../actions";

/**
 * Delete-lead form with a confirmation prompt. Pass `redirectTo` when used
 * somewhere that won't exist after the lead is gone (e.g. the lead detail
 * page); omit it for a row action on the leads list, which just refreshes.
 */
export function DeleteLeadButton({
  leadId,
  businessName,
  redirectTo,
  className,
  children,
}: {
  leadId: string;
  businessName: string;
  redirectTo?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <form
      action={deleteLeadAction}
      onSubmit={(event) => {
        if (!window.confirm(`Delete "${businessName}"? This permanently removes the lead and all its activity, audits, previews, and emails.`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="leadId" value={leadId} />
      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
      <Button
        type="submit"
        size={children ? "sm" : "icon"}
        variant="ghost"
        aria-label={`Delete ${businessName}`}
        className={cn("text-muted hover:text-red-400", className)}
      >
        <Trash2 className="size-4" />
        {children}
      </Button>
    </form>
  );
}

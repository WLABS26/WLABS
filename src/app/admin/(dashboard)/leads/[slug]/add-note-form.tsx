"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { addLeadNoteAction, type AddNoteState } from "./actions";

const initialState: AddNoteState = {};

export function AddNoteForm({ leadId, slug }: { leadId: string; slug: string }) {
  const [state, formAction, pending] = useActionState(addLeadNoteAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="leadId" value={leadId} />
      <input type="hidden" name="slug" value={slug} />

      <Textarea name="note" placeholder="Add a note to this lead's timeline..." required />

      {state?.error && (
        <p role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      )}

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Adding..." : "Add note"}
      </Button>
    </form>
  );
}

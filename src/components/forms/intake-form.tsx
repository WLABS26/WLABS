"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { intakeSubmissionSchema, type IntakeSubmissionInput } from "@/lib/validations";

interface IntakeFormProps {
  slug: string;
  token: string | null;
}

interface FormState {
  targetCustomer: string;
  brandColorPrimary: string;
  brandColorSecondary: string;
  preferredDomain: string;
  additionalNotes: string;
}

const initialState: FormState = {
  targetCustomer: "",
  brandColorPrimary: "",
  brandColorSecondary: "",
  preferredDomain: "",
  additionalNotes: "",
};

export function IntakeForm({ slug, token }: IntakeFormProps) {
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof IntakeSubmissionInput, string>>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const brandColors = [form.brandColorPrimary.trim(), form.brandColorSecondary.trim()].filter(Boolean);
    const payload: IntakeSubmissionInput = {
      targetCustomer: form.targetCustomer,
      brandColors,
      preferredDomain: form.preferredDomain,
      additionalNotes: form.additionalNotes,
    };

    const result = intakeSubmissionSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof IntakeSubmissionInput, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof IntakeSubmissionInput;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setStatus("submitting");
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/intake/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...result.data, token }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Something went wrong. Please try again.");
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="glass-card flex flex-col items-center gap-4 rounded-2xl p-10 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
          <CheckCircle2 className="size-7" />
        </span>
        <h3 className="text-xl font-bold text-white">Thanks - we&apos;ve got it</h3>
        <p className="max-w-sm text-sm leading-relaxed text-muted">
          We&apos;ll use these details to refine your preview and follow up if we have any questions.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card grid grid-cols-1 gap-5 rounded-2xl p-6 sm:p-8">
      <div>
        <h3 className="text-xl font-bold text-white">Tell us more about your business</h3>
        <p className="mt-1 text-sm text-muted">
          Optional, but it helps us tailor your preview to your real brand and customers. Takes about a minute.
        </p>
      </div>

      <Field label="Who is your ideal customer? (optional)" error={errors.targetCustomer}>
        <Textarea
          value={form.targetCustomer}
          onChange={(e) => update("targetCustomer", e.target.value)}
          placeholder="e.g. Homeowners in the local area looking for emergency repairs"
          rows={3}
        />
      </Field>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Primary brand color (optional)">
          <Input
            value={form.brandColorPrimary}
            onChange={(e) => update("brandColorPrimary", e.target.value)}
            placeholder="#1a73e8"
          />
        </Field>

        <Field label="Secondary brand color (optional)">
          <Input
            value={form.brandColorSecondary}
            onChange={(e) => update("brandColorSecondary", e.target.value)}
            placeholder="#06b6d4"
          />
        </Field>
      </div>
      {errors.brandColors ? <p className="-mt-3 text-xs text-red-400">{errors.brandColors}</p> : null}

      <Field label="Preferred domain (optional)">
        <Input
          value={form.preferredDomain}
          onChange={(e) => update("preferredDomain", e.target.value)}
          placeholder="yourbusiness.com"
          autoComplete="url"
        />
      </Field>

      <Field label="Anything else we should know? (optional)" error={errors.additionalNotes}>
        <Textarea
          value={form.additionalNotes}
          onChange={(e) => update("additionalNotes", e.target.value)}
          placeholder="Branding guidelines, pages you'd like included, etc."
          rows={3}
        />
      </Field>

      {status === "error" && errorMessage ? (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="size-4 shrink-0" />
          {errorMessage}
        </div>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={status === "submitting"}>
        {status === "submitting" ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            Send details
            <Send className="size-4" />
          </>
        )}
      </Button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}

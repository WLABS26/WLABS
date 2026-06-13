"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { previewRequestSchema, type PreviewRequestInput } from "@/lib/validations";
import { INDUSTRIES } from "@/modules/shared/constants";

type FormState = PreviewRequestInput;

const initialState: FormState = {
  name: "",
  businessName: "",
  websiteUrl: "",
  email: "",
  phone: "",
  industry: "" as FormState["industry"],
  message: "",
};

export function PreviewRequestForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const result = previewRequestSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FormState, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FormState;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setStatus("submitting");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/leads/preview-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
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
        <h3 className="text-xl font-bold text-white">Request received</h3>
        <p className="max-w-sm text-sm leading-relaxed text-muted">
          Thanks - we&apos;ll review your website and get back to you with a preview concept and a link
          once it&apos;s ready. No spam, and you can opt out at any time.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card grid grid-cols-1 gap-5 rounded-2xl p-6 sm:grid-cols-2 sm:p-8">
      <div className="sm:col-span-2">
        <h3 className="text-xl font-bold text-white">Get your free website preview</h3>
        <p className="mt-1 text-sm text-muted">
          Tell us about your business and current website. We&apos;ll send you a modern homepage
          concept - no obligation.
        </p>
      </div>

      <Field label="Your name" error={errors.name}>
        <Input
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Jane Doe"
          autoComplete="name"
        />
      </Field>

      <Field label="Business name" error={errors.businessName}>
        <Input
          value={form.businessName}
          onChange={(e) => update("businessName", e.target.value)}
          placeholder="Smith Dental Clinic"
          autoComplete="organization"
        />
      </Field>

      <Field label="Current website URL" error={errors.websiteUrl}>
        <Input
          value={form.websiteUrl}
          onChange={(e) => update("websiteUrl", e.target.value)}
          placeholder="yourbusiness.com"
          autoComplete="url"
        />
      </Field>

      <Field label="Email" error={errors.email}>
        <Input
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="you@business.com"
          autoComplete="email"
        />
      </Field>

      <Field label="Phone (optional)" error={errors.phone}>
        <Input
          type="tel"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          placeholder="+353 1 234 5678"
          autoComplete="tel"
        />
      </Field>

      <Field label="Industry" error={errors.industry}>
        <Select value={form.industry} onChange={(e) => update("industry", e.target.value as FormState["industry"])}>
          <option value="">Select your industry</option>
          {INDUSTRIES.map((industry) => (
            <option key={industry.value} value={industry.value}>
              {industry.label}
            </option>
          ))}
        </Select>
      </Field>

      <div className="sm:col-span-2">
        <Field label="Anything else? (optional)" error={errors.message}>
          <Textarea
            value={form.message}
            onChange={(e) => update("message", e.target.value)}
            placeholder="Tell us a bit about your business or what you're hoping to improve."
            rows={3}
          />
        </Field>
      </div>

      {status === "error" && errorMessage ? (
        <div className="sm:col-span-2 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="size-4 shrink-0" />
          {errorMessage}
        </div>
      ) : null}

      <div className="sm:col-span-2">
        <Button type="submit" size="lg" className="w-full" disabled={status === "submitting"}>
          {status === "submitting" ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              Get my free preview
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
        <p className="mt-3 text-center text-xs text-muted">
          We only use this to prepare your preview and a one-time follow-up. No spam, opt out anytime.
        </p>
      </div>
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

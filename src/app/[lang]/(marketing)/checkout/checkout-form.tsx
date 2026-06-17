"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { INDUSTRIES } from "@/modules/shared/constants";

export function CheckoutForm({ lang }: { lang: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const form = e.currentTarget;
    const data = {
      businessName: (form.elements.namedItem("businessName") as HTMLInputElement).value,
      websiteUrl: (form.elements.namedItem("websiteUrl") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value,
      industry: (form.elements.namedItem("industry") as HTMLSelectElement)?.value,
    };

    try {
      const res = await fetch("/api/checkout/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json.url) {
        setError(json.error ?? "Something went wrong. Please try again.");
        setPending(false);
        return;
      }
      window.location.href = json.url;
    } catch {
      setError("Network error. Please try again.");
      setPending(false);
    }
  }

  const de = lang === "de";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="businessName">{de ? "Unternehmensname" : "Business name"} *</Label>
        <Input id="businessName" name="businessName" required placeholder={de ? "Mustermann GmbH" : "Acme Dental"} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="websiteUrl">{de ? "Aktuelle Website (optional)" : "Current website (optional)"}</Label>
        <Input id="websiteUrl" name="websiteUrl" type="url" placeholder="https://example.com" />
      </div>

      <div className="space-y-1">
        <Label htmlFor="email">{de ? "E-Mail-Adresse" : "Email address"} *</Label>
        <Input id="email" name="email" type="email" required placeholder={de ? "max@muster.de" : "you@example.com"} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="phone">{de ? "Telefon (optional)" : "Phone (optional)"}</Label>
        <Input id="phone" name="phone" type="tel" placeholder={de ? "+49 30 12345678" : "+44 20 1234 5678"} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="industry">{de ? "Branche" : "Industry"}</Label>
        <Select id="industry" name="industry">
          <option value="">{de ? "Branche wählen…" : "Select industry…"}</option>
          {INDUSTRIES.map((ind) => (
            <option key={ind.value} value={ind.value}>
              {ind.label}
            </option>
          ))}
        </Select>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending
          ? de
            ? "Weiterleitung…"
            : "Redirecting…"
          : de
            ? "Jetzt bezahlen — €999"
            : "Pay now — €999"}
      </Button>

      <p className="text-center text-xs text-muted">
        {de
          ? "Sicher verschlüsselt via Stripe. Mit Ihrer Bestellung akzeptieren Sie unsere AGB."
          : "Securely processed via Stripe. By ordering you accept our terms of service."}
      </p>
    </form>
  );
}

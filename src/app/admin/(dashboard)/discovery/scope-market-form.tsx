"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INDUSTRIES } from "@/modules/shared/constants";

import { scopeMarketAction, type ScopeMarketState } from "./actions";

const initialState: ScopeMarketState = {};

/** "Scope a new market" form: city + categories + target count, runs discovery synchronously and reports an immediate summary. */
export function ScopeMarketForm({ defaultTarget, remaining }: { defaultTarget: number; remaining: number }) {
  const [state, formAction, pending] = useActionState(scopeMarketAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" placeholder="e.g. Berlin" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="country">Country</Label>
          <Input id="country" name="country" placeholder="e.g. Germany" defaultValue="Germany" list="scope-market-countries" />
          <datalist id="scope-market-countries">
            <option value="Germany" />
            <option value="Austria" />
            <option value="Switzerland" />
          </datalist>
        </div>
      </div>
      <p className="text-xs text-muted">
        Tuned for the DACH region (Germany, Austria, Switzerland) — businesses there are legally required to publish
        an Impressum/legal-notice page, which the crawler reads to fill in contact email and contact person. Other
        countries work too, but contact details will rely on Google Places alone.
      </p>

      <div className="space-y-1.5">
        <Label>Categories</Label>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.map((industry) => (
            <label
              key={industry.value}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white transition-colors hover:bg-white/[0.06]"
            >
              <input
                type="checkbox"
                name="industries"
                value={industry.value}
                className="size-4 rounded border-white/20 bg-white/[0.04] text-brand-cyan accent-brand-cyan"
              />
              {industry.label}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-1.5 sm:max-w-xs">
        <Label htmlFor="targetCount">Target prospects</Label>
        <Input
          id="targetCount"
          name="targetCount"
          type="number"
          min={1}
          max={Math.max(1, remaining)}
          defaultValue={Math.min(defaultTarget, Math.max(1, remaining))}
        />
        <p className="text-xs text-muted">{remaining} discoveries remaining today.</p>
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      )}
      {state?.summary && (
        <div className="space-y-1 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white">
          <p>
            Found {state.summary.placesFound} place{state.summary.placesFound === 1 ? "" : "s"} — imported{" "}
            {state.summary.imported}, skipped {state.summary.skippedDuplicate} duplicate
            {state.summary.skippedDuplicate === 1 ? "" : "s"} and {state.summary.skippedSuppressed} suppressed
            {state.summary.errors > 0 ? `, ${state.summary.errors} errors` : ""}.
          </p>
          {state.summary.leadIds.length > 0 && (
            <p className="text-muted">
              Qualify → crawl → audit is now running in the background for the {state.summary.leadIds.length} new lead
              {state.summary.leadIds.length === 1 ? "" : "s"}. Track progress below, on the{" "}
              <Link href="/admin/workflows" className="text-brand-cyan hover:underline">
                Workflows
              </Link>{" "}
              page, or in{" "}
              <Link href="/admin/leads" className="text-brand-cyan hover:underline">
                Leads
              </Link>
              .
            </p>
          )}
        </div>
      )}

      <Button type="submit" disabled={pending || remaining <= 0}>
        <Compass className="size-4" />
        {pending ? "Scoping market..." : "Scope this market"}
      </Button>
      {remaining <= 0 && <p className="text-xs text-amber-400">Daily discovery cap reached — try again tomorrow.</p>}
    </form>
  );
}

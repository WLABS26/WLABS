"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { runScopeMarketDiscovery, runScopeMarketPipeline } from "@/modules/discovery/scope-market";
import type { ScopeMarketDiscoveryResult } from "@/modules/discovery/types";
import { INDUSTRIES } from "@/modules/shared/constants";
import type { IndustryKey } from "@/modules/shared/types";

const INDUSTRY_VALUES = new Set<string>(INDUSTRIES.map((industry) => industry.value));

const DEFAULT_TARGET = Number(process.env.DISCOVERY_DEFAULT_TARGET ?? 100);

export interface ScopeMarketState {
  error?: string;
  summary?: ScopeMarketDiscoveryResult;
}

/** Discover + import leads for a city/category set, then continue the qualify → crawl → audit pipeline in the background. */
export async function scopeMarketAction(
  _prevState: ScopeMarketState | undefined,
  formData: FormData,
): Promise<ScopeMarketState> {
  const city = String(formData.get("city") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim() || undefined;
  const industries = formData
    .getAll("industries")
    .map(String)
    .filter((value) => INDUSTRY_VALUES.has(value)) as IndustryKey[];
  const targetCount = Number(formData.get("targetCount") ?? DEFAULT_TARGET);

  if (!city) return { error: "City is required." };
  if (industries.length === 0) return { error: "Select at least one category." };

  try {
    const discovery = await runScopeMarketDiscovery({
      city,
      country,
      industries,
      targetCount,
      createdBy: "admin_dashboard",
    });

    if (discovery.leadIds.length > 0) {
      after(() => runScopeMarketPipeline(discovery.discoveryRunId, discovery.leadIds));
    }

    revalidatePath("/admin/discovery");
    revalidatePath("/admin/leads");
    revalidatePath("/admin/workflows");
    revalidatePath("/admin");

    return { summary: discovery };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Scope Market run failed to start." };
  }
}

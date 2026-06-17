/**
 * Scope Market orchestrator.
 *
 * `runScopeMarketDiscovery()` searches Google Places for businesses in a
 * city/category, imports them via the existing CSV-import pipeline (dedup +
 * suppression reused as-is), and returns an immediate summary - typically
 * seconds, safe to await directly from a server action.
 *
 * `runScopeMarketPipeline()` then runs the qualify -> crawl -> audit pipeline
 * for each newly imported lead, routing strong sites (the existing
 * `low_opportunity` boundary, i.e. audit score > 75) to the `dedicated_sales`
 * status instead of the regular redesign-prospects pool. Intended to run in
 * the background via Next.js `after()`.
 */
import { prisma } from "@/lib/prisma";
import { leadImportAgent } from "@/modules/agents/lead-import-agent";
import { runLeadPipeline } from "@/modules/agents/lead-pipeline";
import { finishWorkflowRun, runAgentStep, startWorkflowRun } from "@/modules/agents/runner";
import { logActivity } from "@/modules/crm/activity";
import type { IndustryKey } from "@/modules/shared/types";

import { createDiscoveryRun, getDiscoveredTodayCount, updateDiscoveryRun } from "./discovery-runs";
import { placeToImportRecord } from "./import-mapper";
import { placeDetailsAgent } from "./place-details-agent";
import { placesDiscoveryAgent } from "./places-discovery-agent";
import type { PlaceSearchResult, ScopeMarketDiscoveryResult, ScopeMarketOptions, ScopeMarketPipelineResult } from "./types";

/** Places' per-query page cap. */
const MAX_PAGES_PER_INDUSTRY = 3;
/** Google recommends a short delay before a Text Search page token becomes valid. */
const PAGE_TOKEN_DELAY_MS = 2000;
/** Rate-limit delay between leads in the background pipeline phase, mirroring batch.ts. */
const PIPELINE_DELAY_MS = 250;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getDailyCap(): number {
  return Number(process.env.DISCOVERY_DAILY_CAP ?? 150);
}

/**
 * Discover and import leads for a city across one or more industries. Runs
 * synchronously and returns immediately - the qualify/crawl/audit pipeline
 * for the new leads is a separate step (`runScopeMarketPipeline`).
 */
export async function runScopeMarketDiscovery(options: ScopeMarketOptions): Promise<ScopeMarketDiscoveryResult> {
  if (options.industries.length === 0) throw new Error("Select at least one category.");

  const dailyCap = getDailyCap();
  const discoveredToday = await getDiscoveredTodayCount();
  const remaining = dailyCap - discoveredToday;
  if (remaining <= 0) {
    throw new Error(`Scope Market daily discovery cap reached (${dailyCap} leads/day).`);
  }

  const targetCount = Math.max(1, Math.min(options.targetCount, remaining));
  const perIndustryTarget = Math.ceil(targetCount / options.industries.length);

  const run = await startWorkflowRun({
    workflowType: "scope_market",
    createdBy: options.createdBy ?? "admin_dashboard",
    metadata: { city: options.city, country: options.country, industries: options.industries, targetCount },
  });
  const stepCtx = { workflowRunId: run.id };

  // ---- Step 1: page Places Text Search per industry ----
  const found: PlaceSearchResult[] = [];
  const industryByPlaceId = new Map<string, IndustryKey>();

  for (const industry of options.industries) {
    let pageToken: string | undefined;
    let collected = 0;

    for (let page = 0; page < MAX_PAGES_PER_INDUSTRY; page++) {
      const result = await runAgentStep(
        placesDiscoveryAgent,
        { city: options.city, country: options.country, industry, pageToken },
        stepCtx,
      );
      if (result.status !== "completed" || !result.output) break;

      for (const place of result.output.places) {
        if (!industryByPlaceId.has(place.placeId)) {
          industryByPlaceId.set(place.placeId, industry);
          found.push(place);
          collected++;
        }
      }

      pageToken = result.output.nextPageToken ?? undefined;
      if (!pageToken || collected >= perIndustryTarget) break;
      await sleep(PAGE_TOKEN_DELAY_MS);
    }
  }

  const placesFound = found.length;

  // ---- Step 2: dedup against leads already discovered in a previous run ----
  const existingPlaceIds = new Set(
    (
      await prisma.lead.findMany({
        where: { discoverySourceId: { in: found.map((place) => place.placeId) } },
        select: { discoverySourceId: true },
      })
    )
      .map((lead) => lead.discoverySourceId)
      .filter((id): id is string => Boolean(id)),
  );

  const newPlaces = found.filter((place) => !existingPlaceIds.has(place.placeId));
  let skippedDuplicate = existingPlaceIds.size;
  let skippedSuppressed = 0;

  // ---- Step 3: enrich places missing a website or phone via Place Details ----
  const enriched: PlaceSearchResult[] = [];
  for (const place of newPlaces) {
    if (place.websiteUrl && place.phone) {
      enriched.push(place);
      continue;
    }

    const details = await runAgentStep(placeDetailsAgent, { placeId: place.placeId }, stepCtx);
    if (details.status === "completed" && details.output) {
      enriched.push({
        ...place,
        websiteUrl: place.websiteUrl ?? details.output.websiteUrl,
        phone: place.phone ?? details.output.phone,
        city: place.city ?? details.output.city,
        country: place.country ?? details.output.country,
      });
    } else {
      enriched.push(place);
    }
  }

  // ---- Step 4: import via the existing CSV-import pipeline (dedup + suppression) ----
  const records = enriched.map((place) =>
    placeToImportRecord(place, industryByPlaceId.get(place.placeId) ?? "other", options.city),
  );

  let leadIds: string[] = [];
  let imported = 0;
  let errors = 0;

  if (records.length > 0) {
    const importResult = await runAgentStep(leadImportAgent, { records }, stepCtx);
    if (importResult.status === "completed" && importResult.output) {
      imported = importResult.output.created;
      errors = importResult.output.errors;
      skippedDuplicate += importResult.output.rows.filter((row) => row.status === "skipped_duplicate").length;
      skippedSuppressed += importResult.output.rows.filter((row) => row.status === "skipped_suppressed").length;
      leadIds = importResult.output.rows
        .filter((row) => row.status === "created" && row.leadId)
        .map((row) => row.leadId as string);
    } else {
      errors = records.length;
    }
  }

  const discoveryRun = await createDiscoveryRun({
    workflowRunId: run.id,
    city: options.city,
    country: options.country,
    industries: options.industries,
    targetCount,
    status: leadIds.length > 0 ? "processing" : "completed",
    leadIds,
    placesFound,
    imported,
    skippedDuplicate,
    skippedSuppressed,
    createdBy: options.createdBy,
    completedAt: leadIds.length > 0 ? undefined : new Date(),
  });

  await finishWorkflowRun(run.id, "completed");

  return {
    discoveryRunId: discoveryRun.id,
    workflowRunId: run.id,
    leadIds,
    placesFound,
    imported,
    skippedDuplicate,
    skippedSuppressed,
    errors,
  };
}

/**
 * Run the qualify -> crawl -> audit pipeline for each newly discovered lead.
 * Strong sites (low_opportunity, i.e. audit score > 75) are rerouted to
 * `dedicated_sales`; everything else stays in the regular prospects pipeline
 * with whatever status `runLeadPipeline` assigned.
 */
export async function runScopeMarketPipeline(discoveryRunId: string, leadIds: string[]): Promise<ScopeMarketPipelineResult> {
  for (const leadId of leadIds) {
    try {
      const result = await runLeadPipeline(leadId, { createdBy: "scope_market" });

      if (result.outcome === "audited" && result.opportunity === "low_opportunity") {
        await prisma.lead.update({ where: { id: leadId }, data: { status: "dedicated_sales" } });
        await logActivity(
          leadId,
          "routed_to_dedicated_sales",
          "Routed to dedicated sales - audit score above the redesign threshold.",
        );
      }
    } catch (err) {
      console.error(`Scope Market pipeline failed for lead ${leadId}:`, err);
    }

    if (PIPELINE_DELAY_MS > 0) await sleep(PIPELINE_DELAY_MS);
  }

  const [dedicatedSalesCount, prospectsCount] = await Promise.all([
    prisma.lead.count({ where: { id: { in: leadIds }, status: "dedicated_sales" } }),
    prisma.lead.count({ where: { id: { in: leadIds }, status: { in: ["high_opportunity", "medium_opportunity"] } } }),
  ]);

  await updateDiscoveryRun(discoveryRunId, {
    status: "completed",
    completedAt: new Date(),
    dedicatedSalesCount,
    prospectsCount,
  });

  return { discoveryRunId, processed: leadIds.length, dedicatedSalesCount, prospectsCount };
}

/**
 * WLABS internal agent system - public surface.
 *
 * The agent interface (Agent base class), the workflow runner, and the
 * concrete agents that make up the website-factory pipeline.
 */
export { Agent, ApprovalRequiredError, NonRetryableError } from "./base-agent";
export type { AgentResult, AgentOutcome, RetryPolicy } from "./types";
export {
  startWorkflowRun,
  finishWorkflowRun,
  runAgentStep,
  recordSkippedStep,
} from "./runner";

export { leadImportAgent, LeadImportAgent } from "./lead-import-agent";
export { leadQualificationAgent, LeadQualificationAgent } from "./lead-qualification-agent";
export { websiteCrawlAgent, WebsiteCrawlAgent } from "./website-crawl-agent";
export { websiteAuditAgent, WebsiteAuditAgent } from "./website-audit-agent";
export { redesignStrategyAgent, RedesignStrategyAgent } from "./redesign-strategy-agent";
export { previewGenerationAgent, PreviewGenerationAgent } from "./preview-generation-agent";
export { previewQcAgent, PreviewQcAgent } from "./preview-qc-agent";
export { emailDraftingAgent, EmailDraftingAgent } from "./email-drafting-agent";
export { emailQcAgent, EmailQcAgent } from "./email-qc-agent";

export { runLeadPipeline } from "./lead-pipeline";
export type { RunLeadPipelineResult, PipelineOutcome } from "./lead-pipeline";
export { runPreviewGeneration, runPreviewQc } from "./preview-pipeline";
export type { RunPreviewGenerationResult, RunPreviewQcResult } from "./preview-pipeline";
export { runEmailDrafting } from "./email-pipeline";
export type { RunEmailDraftingResult } from "./email-pipeline";

// Read helpers for the admin dashboard (defined in workflow.ts).
export { listWorkflowRuns, getWorkflowRun } from "./workflow";
export type { WorkflowRunListItem, WorkflowRunDetail } from "./workflow";

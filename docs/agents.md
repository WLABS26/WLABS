# WLABS Agent System

WLABS replaces external automation tools (n8n et al.) with an **internal agentic
workflow engine**. Every automation is a modular, testable `Agent` orchestrated
into pipelines and persisted as `WorkflowRun` / `WorkflowStep` records, so all
activity is visible and auditable in the admin dashboard.

## The Agent contract

`src/modules/agents/base-agent.ts` defines the base class. Every agent declares:

- `name`, `description`
- `inputSchema`, `outputSchema` (zod) — validated on the way in and out
- `execute(input, ctx)` — the business logic
- `retryPolicy` — retry-with-backoff (non-retryable errors opt out)

`agent.run(input, ctx)` never throws: it validates, executes with retry,
validates the output, and returns a typed `AgentResult` (`completed` / `failed`
/ `waiting_for_approval` / `skipped`) with structured logs. Control-flow signals:

- `ApprovalRequiredError` → pauses a workflow at a human gate.
- `NonRetryableError` → fails immediately without consuming retries.

## The runner

`src/modules/agents/runner.ts` bridges agents and the database:

- `startWorkflowRun` / `finishWorkflowRun` manage a `WorkflowRun`.
- `runAgentStep(agent, input, ctx)` persists a `WorkflowStep` (running →
  completed/failed), storing the input, output, error, timings, and retry count.
- `recordSkippedStep` marks downstream steps skipped when an upstream one fails.

## The agents

| Agent | Purpose | Output |
|-------|---------|--------|
| `lead_import_agent` | Validate, dedupe, suppression-check a batch of leads | created / skipped / error rows |
| `lead_qualification_agent` | Decide eligibility | `ready_for_crawl` / `needs_manual_review` / `rejected` |
| `website_crawl_agent` | SSRF-safe fetch + metadata extraction | `WebsiteCapture` data |
| `website_audit_agent` | 100-point deterministic scoring | audit + opportunity level |
| `redesign_brief_agent` | Audit → MVP-constrained redesign brief | `RedesignBrief` |
| `preview_generator_agent` | Brief + template → preview content/theme | `Preview` content |
| `preview_qc_agent` | Review preview for accuracy + brand-safety | `passed` / `needs_review` / `failed` |
| `email_drafting_agent` | Personalized, compliant outreach (6 variants) | `EmailDraft` (always draft) |
| `email_qc_agent` | Review email for compliance/tone | `passed` / `needs_review` / `failed` |

## Pipelines

- **`runLeadPipeline(leadId)`** — Qualify → Crawl → Audit. Writes
  `WebsiteCapture` + `Audit`, advances lead status.
- **`runPreviewGeneration(leadId)`** + **`runPreviewQc(previewId)`** — Redesign
  brief → Preview content → QC. Writes `RedesignBrief` + `Preview`.
- **`runEmailDrafting(leadId, variant)`** — Draft → QC. Writes `EmailDraft`.
  **Never sends.**
- **`runBatch({ operation, batchSize })`** — runs one of the above across a
  controlled, rate-limited batch of eligible, non-suppressed leads.

## Inbound lead workflow

`processInboundLead` (`src/modules/lead-source/inbound.ts`) handles public form
submissions: store the request → check suppression → dedupe → create/link a
`Lead` → log activity. The crawl/audit/preview/email steps then run via the
pipelines above and surface in the review queue.

## Human approval gates

No preview is client-ready and no email is send-ready until a human approves it
(`src/modules/crm/approvals.ts`). Approvals, suppression, and the terminal CRM
transitions (contacted / replied / won / lost) all live behind the dashboard.

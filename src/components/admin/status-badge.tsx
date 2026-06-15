import type { VariantProps } from "class-variance-authority";

import { Badge, badgeVariants } from "@/components/ui/badge";
import type { AgentStepStatus, InboundRequestStatus, LeadStatus, WorkflowRunStatus } from "@/modules/shared/types";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

/** Convert a snake_case status value into a human-readable label, e.g. "preview_qc_passed" -> "Preview QC Passed". */
export function humanizeStatus(status: string): string {
  return status
    .split("_")
    .map((word) => (word === "qc" ? "QC" : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(" ");
}

const LEAD_STATUS_VARIANTS: Record<LeadStatus, BadgeVariant> = {
  imported: "default",
  qualified: "brand",
  rejected: "destructive",
  crawled: "default",
  audited: "default",
  high_opportunity: "success",
  medium_opportunity: "warning",
  low_opportunity: "outline",
  dedicated_sales: "warning",
  preview_generated: "brand",
  preview_qc_passed: "success",
  preview_needs_review: "warning",
  email_drafted: "brand",
  email_qc_passed: "success",
  approved: "success",
  contacted: "brand",
  replied: "brand",
  booked_call: "success",
  won: "success",
  lost: "destructive",
  suppressed: "destructive",
};

const WORKFLOW_RUN_STATUS_VARIANTS: Record<WorkflowRunStatus, BadgeVariant> = {
  pending: "outline",
  running: "brand",
  waiting_for_approval: "warning",
  completed: "success",
  failed: "destructive",
  cancelled: "destructive",
  paused: "warning",
};

const AGENT_STEP_STATUS_VARIANTS: Record<AgentStepStatus, BadgeVariant> = {
  pending: "outline",
  running: "brand",
  completed: "success",
  failed: "destructive",
  skipped: "default",
  waiting_for_approval: "warning",
  retrying: "warning",
};

const INBOUND_REQUEST_STATUS_VARIANTS: Record<InboundRequestStatus, BadgeVariant> = {
  new: "brand",
  processing: "warning",
  converted: "success",
  closed: "default",
};

export function LeadStatusBadge({ status, className }: { status: LeadStatus; className?: string }) {
  return (
    <Badge variant={LEAD_STATUS_VARIANTS[status]} className={className}>
      {humanizeStatus(status)}
    </Badge>
  );
}

export function WorkflowRunStatusBadge({ status, className }: { status: WorkflowRunStatus; className?: string }) {
  return (
    <Badge variant={WORKFLOW_RUN_STATUS_VARIANTS[status]} className={className}>
      {humanizeStatus(status)}
    </Badge>
  );
}

export function AgentStepStatusBadge({ status, className }: { status: AgentStepStatus; className?: string }) {
  return (
    <Badge variant={AGENT_STEP_STATUS_VARIANTS[status]} className={className}>
      {humanizeStatus(status)}
    </Badge>
  );
}

export function InboundRequestStatusBadge({ status, className }: { status: InboundRequestStatus; className?: string }) {
  return (
    <Badge variant={INBOUND_REQUEST_STATUS_VARIANTS[status]} className={className}>
      {humanizeStatus(status)}
    </Badge>
  );
}

import { prisma } from "@/lib/prisma";

/** List recent workflow runs for the admin workflows list, newest first. */
export async function listWorkflowRuns(limit = 50) {
  return prisma.workflowRun.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      _count: { select: { steps: true } },
    },
  });
}

export type WorkflowRunListItem = Awaited<ReturnType<typeof listWorkflowRuns>>[number];

/** Fetch a single workflow run with its ordered steps for the run detail page. */
export async function getWorkflowRun(id: string) {
  return prisma.workflowRun.findUnique({
    where: { id },
    include: {
      steps: {
        orderBy: { createdAt: "asc" },
        include: { lead: { select: { businessName: true, slug: true } } },
      },
    },
  });
}

export type WorkflowRunDetail = NonNullable<Awaited<ReturnType<typeof getWorkflowRun>>>;

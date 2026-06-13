import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { NewLeadForm } from "./new-lead-form";

export const metadata: Metadata = {
  title: "New Lead",
};

export default function NewLeadPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/admin/leads" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-white">
        <ArrowLeft className="size-4" />
        Back to leads
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white">New lead</h1>
        <p className="mt-1 text-sm text-muted">Manually add a lead to the CRM pipeline.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lead details</CardTitle>
        </CardHeader>
        <CardContent>
          <NewLeadForm />
        </CardContent>
      </Card>
    </div>
  );
}

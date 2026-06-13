import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { ImportCsvForm } from "./import-csv-form";

export const metadata: Metadata = {
  title: "Import Leads",
};

export default function ImportLeadsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/admin/leads" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-white">
        <ArrowLeft className="size-4" />
        Back to leads
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white">Import leads from CSV</h1>
        <p className="mt-1 text-sm text-muted">
          Upload a CSV file or paste CSV text. Columns: businessName (required), industry, websiteUrl, contactEmail,
          contactPhone, contactPerson, city, country, notes.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>CSV import</CardTitle>
          <CardDescription>
            Rows matching the suppression list or an existing lead (by website or email) are skipped.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImportCsvForm />
        </CardContent>
      </Card>
    </div>
  );
}

"use server";

import { revalidatePath } from "next/cache";

import { importLeadsFromCsvText, type CsvImportResult } from "@/modules/lead-source/csv-import";

export interface ImportCsvState {
  error?: string;
  result?: CsvImportResult;
}

export async function importCsvAction(_prevState: ImportCsvState | undefined, formData: FormData): Promise<ImportCsvState> {
  const file = formData.get("file");
  const pasted = String(formData.get("csvText") ?? "").trim();

  let csvText = pasted;

  if (file instanceof File && file.size > 0) {
    csvText = await file.text();
  }

  if (!csvText.trim()) {
    return { error: "Provide a CSV file or paste CSV text." };
  }

  const result = await importLeadsFromCsvText(csvText);

  if (result.created > 0) {
    revalidatePath("/admin/leads");
    revalidatePath("/admin");
  }

  return { result };
}

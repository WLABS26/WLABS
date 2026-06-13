import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export function AdminPagination({
  page,
  totalPages,
  basePath,
  searchParams,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  function hrefForPage(target: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams ?? {})) {
      if (value && key !== "page") params.set(key, value);
    }
    if (target > 1) params.set("page", String(target));
    const query = params.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  const linkClass =
    "inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.03] px-4 py-2 text-sm text-white transition-colors hover:bg-white/10 hover:border-white/30";

  return (
    <div className="flex items-center justify-between border-t border-white/10 pt-4">
      <p className="text-sm text-muted">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <Link
          href={hrefForPage(page - 1)}
          aria-disabled={page <= 1}
          tabIndex={page <= 1 ? -1 : undefined}
          className={cn(linkClass, page <= 1 && "pointer-events-none opacity-40")}
        >
          <ChevronLeft className="size-4" />
          Previous
        </Link>
        <Link
          href={hrefForPage(page + 1)}
          aria-disabled={page >= totalPages}
          tabIndex={page >= totalPages ? -1 : undefined}
          className={cn(linkClass, page >= totalPages && "pointer-events-none opacity-40")}
        >
          Next
          <ChevronRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}

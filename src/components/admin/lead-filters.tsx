"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { humanizeStatus } from "@/components/admin/status-badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { INDUSTRIES } from "@/modules/shared/constants";
import { LEAD_STATUSES } from "@/modules/shared/types";

export function LeadFilters({
  status,
  industry,
  search,
}: {
  status?: string;
  industry?: string;
  search?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = React.useState(search ?? "");

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    params.delete("page");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:items-center"
      onSubmit={(event) => {
        event.preventDefault();
        updateParams({ search: searchValue.trim() });
      }}
    >
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <Input
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Search business, contact, email, website..."
          className="pl-10"
        />
      </div>

      <Select
        value={status ?? ""}
        onChange={(event) => updateParams({ status: event.target.value })}
        className="sm:w-48"
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        {LEAD_STATUSES.map((value) => (
          <option key={value} value={value}>
            {humanizeStatus(value)}
          </option>
        ))}
      </Select>

      <Select
        value={industry ?? ""}
        onChange={(event) => updateParams({ industry: event.target.value })}
        className="sm:w-48"
        aria-label="Filter by industry"
      >
        <option value="">All industries</option>
        {INDUSTRIES.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </form>
  );
}

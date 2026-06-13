import Link from "next/link";
import { FlaskConical } from "lucide-react";

import { cn } from "@/lib/utils";
import { BRAND } from "@/modules/shared/constants";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("group flex items-center gap-2.5", className)}>
      <span className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-brand shadow-lg shadow-brand-blue/30 transition-transform group-hover:scale-105">
        <FlaskConical className="size-5 text-white" strokeWidth={2.25} />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-lg font-bold tracking-tight text-white">{BRAND.name}</span>
        <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
          {BRAND.fullName}
        </span>
      </span>
    </Link>
  );
}

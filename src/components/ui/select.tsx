import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="select"
        className={cn(
          "flex h-11 w-full appearance-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 pr-10 text-sm text-white shadow-sm transition-colors outline-none",
          "focus-visible:border-brand-cyan/60 focus-visible:ring-2 focus-visible:ring-brand-cyan/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "[&>option]:bg-brand-navy [&>option]:text-white",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
    </div>
  );
}

export { Select };

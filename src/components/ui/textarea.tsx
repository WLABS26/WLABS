import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-24 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-muted shadow-sm transition-colors outline-none",
        "focus-visible:border-brand-cyan/60 focus-visible:ring-2 focus-visible:ring-brand-cyan/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-red-500/60 aria-invalid:ring-red-500/20",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };

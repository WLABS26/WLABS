import { cn } from "@/lib/utils";

/**
 * Stylized "browser window" frame used in hero/before-after visuals.
 * `tone` controls whether it renders as an outdated ("muted") or modern
 * ("brand") mockup.
 */
export function BrowserMockup({
  tone = "brand",
  label,
  className,
  children,
}: {
  tone?: "muted" | "brand";
  label?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border shadow-2xl",
        tone === "brand" ? "border-white/10 bg-brand-navy/80 shadow-brand-blue/20" : "border-white/5 bg-slate-900/80",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-red-400/70" />
          <span className="size-2.5 rounded-full bg-amber-400/70" />
          <span className="size-2.5 rounded-full bg-emerald-400/70" />
        </div>
        {label ? (
          <div className="ml-3 flex-1 truncate rounded-md bg-white/5 px-3 py-1 text-[11px] text-muted">
            {label}
          </div>
        ) : null}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function MockupSkeleton({ tone = "brand" }: { tone?: "muted" | "brand" }) {
  const isBrand = tone === "brand";
  return (
    <div className="space-y-3">
      <div
        className={cn(
          "h-20 w-full rounded-lg",
          isBrand ? "bg-gradient-brand opacity-80" : "bg-slate-700/60",
        )}
      />
      <div className="space-y-2">
        <div className={cn("h-2.5 w-3/4 rounded-full", isBrand ? "bg-white/20" : "bg-slate-600/60")} />
        <div className={cn("h-2.5 w-1/2 rounded-full", isBrand ? "bg-white/10" : "bg-slate-700/50")} />
      </div>
      <div className="flex gap-2 pt-1">
        <div className={cn("h-7 w-20 rounded-full", isBrand ? "bg-brand-cyan/80" : "bg-slate-600/50")} />
        <div className={cn("h-7 w-20 rounded-full border", isBrand ? "border-white/20" : "border-slate-600/50")} />
      </div>
      <div className="grid grid-cols-3 gap-2 pt-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn("h-12 rounded-md", isBrand ? "bg-white/[0.06]" : "bg-slate-800/60")}
          />
        ))}
      </div>
    </div>
  );
}

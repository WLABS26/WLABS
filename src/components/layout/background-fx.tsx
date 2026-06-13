/**
 * Decorative background: subtle grid + animated gradient glows.
 * Purely presentational, aria-hidden, fixed behind page content.
 */
export function BackgroundFx() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-brand-navy">
      <div className="bg-grid absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_top,white,transparent_70%)]" />
      <div className="absolute -top-40 left-1/4 size-[36rem] rounded-full bg-brand-blue/25 blur-[140px] animate-glow-pulse" />
      <div className="absolute top-1/3 -right-40 size-[32rem] rounded-full bg-brand-purple/20 blur-[140px] animate-glow-pulse [animation-delay:-2s]" />
      <div className="absolute bottom-0 left-1/3 size-[28rem] rounded-full bg-brand-cyan/15 blur-[140px] animate-glow-pulse [animation-delay:-4s]" />
    </div>
  );
}

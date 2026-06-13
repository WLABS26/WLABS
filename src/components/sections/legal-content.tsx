export function LegalContent({ children }: { children: React.ReactNode }) {
  return (
    <section className="section-padding pt-0">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <article className="glass-card space-y-8 rounded-2xl p-8 text-sm leading-relaxed text-muted sm:p-10 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-white [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
          {children}
        </article>
      </div>
    </section>
  );
}

import { SectionHeading } from "@/components/sections/section-heading";

/** Compact hero/heading block used at the top of inner marketing pages. */
export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <section className="pt-28 pb-4 sm:pt-36 sm:pb-8">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading eyebrow={eyebrow} title={title} description={description} />
      </div>
    </section>
  );
}

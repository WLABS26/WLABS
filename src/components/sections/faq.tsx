import { FadeIn } from "@/components/motion/fade-in";
import { SectionHeading } from "@/components/sections/section-heading";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqDict {
  eyebrow: string;
  title: string;
  description: string;
  items: FaqItem[];
}

export function Faq({ dict }: { dict: FaqDict }) {
  return (
    <section id="faq" className="section-padding">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <SectionHeading eyebrow={dict.eyebrow} title={dict.title} description={dict.description} />

        <FadeIn delay={0.1} className="mt-12">
          <Accordion type="single" collapsible className="space-y-3">
            {dict.items.map((item, i) => (
              <AccordionItem key={item.question} value={`item-${i}`}>
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </FadeIn>
      </div>
    </section>
  );
}

import { SectionHeader } from '@/components/marketplace/section-header';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { SERVICES_FAQ } from '@/features/marketing/services/services-data';

export function ServicesFaq() {
  return (
    <section id="faq" aria-labelledby="services-faq-title" className="bg-background py-12 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="FAQ"
          title="Common questions"
          description="Quick answers about booking, pricing, and care — before you schedule your first pickup."
          align="center"
          className="mb-8"
        />

        <Accordion type="single" collapsible className="w-full">
          {SERVICES_FAQ.map(({ id, question, answer }) => (
            <AccordionItem key={id} value={id}>
              <AccordionTrigger>{question}</AccordionTrigger>
              <AccordionContent>{answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

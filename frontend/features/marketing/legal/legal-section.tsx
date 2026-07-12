import { cn } from '@/lib/utils';

export const legalBodyClass =
  'space-y-4 text-base leading-relaxed text-muted-foreground sm:text-[15px] sm:leading-7 [&_a]:font-medium [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline [&_li]:leading-relaxed [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5';

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-b border-border/60 py-10 last:border-b-0 sm:py-12">
      <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h2>
      <div className={cn('mt-4', legalBodyClass)}>{children}</div>
    </section>
  );
}

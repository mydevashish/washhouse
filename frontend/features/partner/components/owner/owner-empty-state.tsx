import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function OwnerEmptyState({
  title,
  description,
  imageSrc,
  imageAlt,
  action,
  className,
}: {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  action?: { label: string; href: string };
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        'flex flex-col items-center rounded-xl border border-dashed border-border/80 bg-card/50 px-5 py-10 text-center',
        className,
      )}
    >
      {/* <div className="relative h-24 w-24 overflow-hidden rounded-2xl ring-1 ring-border/50 sm:h-28 sm:w-28">
        <Image src={imageSrc} alt={imageAlt} fill sizes="112px" className="object-cover" />
      </div> */}
      <h3 className="mt-5 text-balance text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      {action ? (
        <Button asChild size="lg" className="mt-5">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      ) : null}
    </div>
  );
}

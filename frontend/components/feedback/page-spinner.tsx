import { WashhouseLoader } from '@/components/brand/washhouse-loader';
import { cn } from '@/lib/utils';

type PageSpinnerProps = {
  label?: string;
  className?: string;
};

export function PageSpinner({ label = 'Loading', className }: PageSpinnerProps) {
  return (
    <div
      className={cn(
        // h-full fills partner/admin main (h-screen shells); calc min-h centers in customer AppShell
        'flex h-full min-h-[max(40vh,calc(100dvh-10rem))] w-full flex-col items-center justify-center gap-3 px-4',
        className,
      )}
    >
      <WashhouseLoader size="md" label={label} />
    </div>
  );
}

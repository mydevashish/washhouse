import Image from 'next/image';

import { cn } from '@/lib/utils';

function testimonialInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

type TestimonialAvatarProps = {
  name: string;
  avatarUrl?: string;
  className?: string;
};

/** Customer avatar — remote URL when API provides one; otherwise name initials. */
export function TestimonialAvatar({ name, avatarUrl, className }: TestimonialAvatarProps) {
  const ringClass = 'ring-2 ring-brand-500/20';

  if (avatarUrl) {
    return (
      <div
        className={cn(
          'relative h-12 w-12 overflow-hidden rounded-full',
          ringClass,
          className,
        )}
      >
        <Image src={avatarUrl} alt="" fill className="object-cover" sizes="48px" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/10 text-sm font-semibold text-brand-700 dark:text-brand-300',
        ringClass,
        className,
      )}
      aria-hidden
    >
      {testimonialInitials(name)}
    </div>
  );
}

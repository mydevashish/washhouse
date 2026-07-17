type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
  titleId?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'left',
  className = '',
  titleId,
}: SectionHeaderProps) {
  const alignClass = align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl';

  return (
    <header className={`${alignClass} ${className}`}>
      {eyebrow && (
        <p className="text-xs font-bold uppercase tracking-widest text-primary sm:text-sm">
          {eyebrow}
        </p>
      )}
      <h2
        id={titleId}
        className="mt-2 text-2xl font-bold tracking-tight text-foreground text-balance sm:text-3xl"
      >
        {title}
      </h2>
      {description && (
        <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">
          {description}
        </p>
      )}
    </header>
  );
}

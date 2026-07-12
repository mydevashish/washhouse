type PageHeaderProps = {
  title: string;
  description?: string;
  /** Optional hint for first-time users */
  hint?: string;
};

export function PageHeader({ title, description, hint }: PageHeaderProps) {
  return (
    <header className="mb-4 max-w-2xl">
      <h1 className="page-title">{title}</h1>
      {description && (
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}
      {hint && (
        <p className="helper-text mt-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
          {hint}
        </p>
      )}
    </header>
  );
}

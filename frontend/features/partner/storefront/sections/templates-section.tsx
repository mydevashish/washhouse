'use client';

import { Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { StorefrontTemplate } from '@/services/storefront';

export function StorefrontTemplatesSection({
  templates,
  currentId,
  loading,
  onApply,
}: {
  templates: StorefrontTemplate[];
  currentId: string;
  loading: boolean;
  onApply: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Templates</CardTitle>
        <CardDescription>Start from a ready-made layout, then customize.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {templates.map((t) => {
          const active = t.id === currentId;
          return (
            <div
              key={t.id}
              className={`rounded-xl border p-3 transition-colors ${
                active ? 'border-primary bg-primary/5' : 'border-border/60'
              }`}
            >
              <div className="mb-2 flex gap-2">
                <span
                  className="h-8 w-8 rounded-lg border border-border/40"
                  style={{ background: t.brand_primary }}
                  aria-hidden
                />
                <span
                  className="h-8 w-8 rounded-lg border border-border/40"
                  style={{ background: t.brand_secondary }}
                  aria-hidden
                />
              </div>
              <p className="font-medium text-sm">{t.name}</p>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{t.description}</p>
              <Button
                type="button"
                size="sm"
                variant={active ? 'secondary' : 'outline'}
                className="mt-3 w-full"
                disabled={loading || active}
                onClick={() => onApply(t.id)}
              >
                {active ? (
                  <>
                    <Check className="mr-1 h-3.5 w-3.5" /> Active
                  </>
                ) : (
                  'Use template'
                )}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

'use client';

import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { StorefrontHighlight } from '@/services/storefront';

export function StorefrontHighlightsSection({
  highlights,
  onChange,
}: {
  highlights: StorefrontHighlight[];
  onChange: (items: StorefrontHighlight[]) => void;
}) {
  function update(index: number, patch: Partial<StorefrontHighlight>) {
    onChange(highlights.map((h, i) => (i === index ? { ...h, ...patch } : h)));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Why choose us</CardTitle>
        <CardDescription>Trust cards that explain your unique value.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {highlights.map((h, i) => (
          <div key={i} className="rounded-xl border border-border/60 p-4 space-y-3">
            <div className="flex justify-between">
              <Label>Highlight {i + 1}</Label>
              <button
                type="button"
                className="text-destructive"
                aria-label="Remove"
                onClick={() => onChange(highlights.filter((_, j) => j !== i))}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <Input
              value={h.title}
              onChange={(e) => update(i, { title: e.target.value })}
              placeholder="15 Years Experience"
            />
            <Textarea
              value={h.description ?? ''}
              onChange={(e) => update(i, { description: e.target.value || null })}
              placeholder="Short supporting text"
              rows={2}
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => onChange([...highlights, { title: '', description: '' }])}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add highlight
        </Button>
      </CardContent>
    </Card>
  );
}

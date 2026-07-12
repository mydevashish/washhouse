'use client';

import Image from 'next/image';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { resolveStorefrontImage, type StorefrontMachine } from '@/services/storefront';

export function StorefrontMachinesSection({
  machines,
  onChange,
}: {
  machines: StorefrontMachine[];
  onChange: (items: StorefrontMachine[]) => void;
}) {
  function update(index: number, patch: Partial<StorefrontMachine>) {
    onChange(machines.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Machine showcase</CardTitle>
        <CardDescription>Show equipment to build trust and transparency.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {machines.map((m, i) => (
          <div key={m.id} className="grid gap-4 rounded-xl border border-border/60 p-4 lg:grid-cols-[120px_1fr]">
            {m.image_url && (
              <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                <Image
                  src={resolveStorefrontImage(m.image_url)}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="120px"
                />
              </div>
            )}
            <div className="space-y-3">
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-destructive"
                  onClick={() => onChange(machines.filter((_, j) => j !== i))}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Machine name</Label>
                  <Input value={m.name} onChange={(e) => update(i, { name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Brand</Label>
                  <Input value={m.brand ?? ''} onChange={(e) => update(i, { brand: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={m.description ?? ''}
                  onChange={(e) => update(i, { description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input
                  value={m.image_url ?? ''}
                  onChange={(e) => update(i, { image_url: e.target.value || null })}
                />
              </div>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            onChange([
              ...machines,
              {
                id: crypto.randomUUID(),
                name: '',
                brand: '',
                description: '',
                image_url: null,
              },
            ])
          }
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add machine
        </Button>
      </CardContent>
    </Card>
  );
}

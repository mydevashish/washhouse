'use client';

import Image from 'next/image';
import { GripVertical, Star, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
function newId() {
  return crypto.randomUUID();
}

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  resolveStorefrontImage,
  uploadStorefrontImage,
  type StorefrontGalleryItem,
} from '@/services/storefront';

export function StorefrontGallerySection({
  gallery,
  categories,
  onChange,
}: {
  gallery: StorefrontGalleryItem[];
  categories: string[];
  onChange: (items: StorefrontGalleryItem[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function addFiles(files: FileList | File[]) {
    setUploading(true);
    try {
      const next = [...gallery];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        const url = await uploadStorefrontImage(file);
        next.push({
          id: newId(),
          url,
          category: 'store',
          sort_order: next.length,
          is_featured: next.length === 0,
        });
      }
      onChange(next);
      toast.success('Image added');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...gallery];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    const a = next[index]!;
    next[index] = next[target]!;
    next[target] = a;
    onChange(next.map((g, i) => ({ ...g, sort_order: i })));
  }

  function setFeatured(id: string) {
    onChange(gallery.map((g) => ({ ...g, is_featured: g.id === id })));
  }

  function remove(id: string) {
    onChange(gallery.filter((g) => g.id !== id).map((g, i) => ({ ...g, sort_order: i })));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Gallery</CardTitle>
        <CardDescription>Drag to reorder. Star one image as featured.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          role="button"
          tabIndex={0}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            void addFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
            dragOver ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-primary/50'
          }`}
        >
          <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">Drop images here or click to upload</p>
          <p className="mt-1 text-xs text-muted-foreground">JPEG, PNG, WebP up to 5 MB</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && void addFiles(e.target.files)}
          />
        </div>

        {uploading && <p className="text-sm text-muted-foreground">Uploading…</p>}

        <div className="space-y-2">
          <Label>Or paste image URL</Label>
          <div className="flex gap-2">
            <Input id="gallery-url" placeholder="https://..." />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const el = document.getElementById('gallery-url') as HTMLInputElement;
                const url = el?.value?.trim();
                if (!url) return;
                onChange([
                  ...gallery,
                  {
                    id: newId(),
                    url,
                    category: 'store',
                    sort_order: gallery.length,
                    is_featured: gallery.length === 0,
                  },
                ]);
                el.value = '';
              }}
            >
              Add
            </Button>
          </div>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {gallery.map((item, index) => (
            <li
              key={item.id}
              className="group relative overflow-hidden rounded-xl border border-border/60 bg-card"
            >
              <div className="relative aspect-[4/3] bg-muted">
                <Image
                  src={resolveStorefrontImage(item.url)}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="240px"
                />
              </div>
              <div className="flex items-center gap-1 border-t border-border/60 p-2">
                <button
                  type="button"
                  className="rounded p-1 hover:bg-muted"
                  aria-label="Move up"
                  onClick={() => move(index, -1)}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </button>
                <select
                  className="flex-1 rounded border border-border/60 bg-background px-2 py-1 text-xs"
                  value={item.category}
                  onChange={(e) =>
                    onChange(
                      gallery.map((g) =>
                        g.id === item.id ? { ...g, category: e.target.value } : g,
                      ),
                    )
                  }
                >
                  {(categories.length ? categories : ['store']).map((c) => (
                    <option key={c} value={c}>
                      {c.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className={`rounded p-1 ${item.is_featured ? 'text-rating' : 'hover:bg-muted'}`}
                  aria-label="Set featured"
                  onClick={() => setFeatured(item.id)}
                >
                  <Star className={`h-4 w-4 ${item.is_featured ? 'fill-current' : ''}`} />
                </button>
                <button
                  type="button"
                  className="rounded p-1 text-destructive hover:bg-destructive/10"
                  aria-label="Remove"
                  onClick={() => remove(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

'use client';

import { useCallback, useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  DISPUTE_TYPES,
  fileDispute,
  type DisputeType,
} from '@/services/disputes';
import { cn } from '@/lib/utils';

const MAX_PHOTOS = 5;

type FileDisputeFormProps = {
  orderId: string;
  trackingCode?: string;
  onFiled?: (disputeId: string) => void;
  className?: string;
};

export function FileDisputeForm({ orderId, trackingCode, onFiled, className }: FileDisputeFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<DisputeType>('missing_item');
  const [notes, setNotes] = useState('');
  const [pending, setPending] = useState<{ id: string; file: File; preview: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const addFiles = useCallback((files: FileList | File[]) => {
    const next: typeof pending = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      if (pending.length + next.length >= MAX_PHOTOS) break;
      next.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        preview: URL.createObjectURL(file),
      });
    }
    if (next.length) setPending((prev) => [...prev, ...next].slice(0, MAX_PHOTOS));
  }, [pending.length]);

  function removePhoto(id: string) {
    setPending((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((p) => p.id !== id);
    });
  }

  async function submit() {
    if (notes.trim().length < 10) {
      toast.error('Add at least 10 characters describing the issue');
      return;
    }
    setSubmitting(true);
    try {
      const result = await fileDispute({
        orderId,
        complaintType: type,
        description: notes.trim(),
        photos: pending.map((p) => p.file),
      });
      pending.forEach((p) => URL.revokeObjectURL(p.preview));
      setPending([]);
      setNotes('');
      toast.success('Dispute filed — we will review it shortly');
      onFiled?.(result.id);
    } catch {
      toast.error('Could not file dispute — try again');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className={cn('rounded-2xl border-warning/30 ring-1 ring-warning/15', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Report an issue</CardTitle>
        <CardDescription>
          {trackingCode ? `Order #${trackingCode} — ` : ''}
          Attach photos and notes. Our team will investigate using pickup and delivery records.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`dispute-type-${orderId}`}>Issue type</Label>
          <Select
            id={`dispute-type-${orderId}`}
            value={type}
            onChange={(e) => setType(e.target.value as DisputeType)}
            className="h-11"
          >
            {DISPUTE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`dispute-notes-${orderId}`}>Notes</Label>
          <Textarea
            id={`dispute-notes-${orderId}`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe what went wrong…"
            rows={4}
            maxLength={5000}
            disabled={submitting}
          />
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          aria-hidden
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = '';
          }}
        />

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            disabled={submitting || pending.length >= MAX_PHOTOS}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus className="h-4 w-4" aria-hidden />
            Add photos ({pending.length}/{MAX_PHOTOS})
          </Button>
        </div>

        {pending.length > 0 && (
          <ul className="grid grid-cols-3 gap-2">
            {pending.map((photo, index) => (
              <li key={photo.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.preview} alt={`Pending ${index + 1}`} className="aspect-square rounded-lg object-cover" />
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute right-1 top-1 h-7 w-7"
                  disabled={submitting}
                  onClick={() => removePhoto(photo.id)}
                  aria-label={`Remove photo ${index + 1}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <Button type="button" className="min-h-[44px] w-full" disabled={submitting} onClick={() => void submit()}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Submitting…
            </>
          ) : (
            'File dispute'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

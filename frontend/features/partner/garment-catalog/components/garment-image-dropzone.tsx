'use client';

import Image from 'next/image';
import { Loader2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';

import { cn } from '@/lib/utils';

export function GarmentImageDropzone({
  previewSrc,
  previewAlt,
  uploading,
  onFileSelect,
}: {
  previewSrc?: string | null;
  previewAlt: string;
  uploading?: boolean;
  onFileSelect: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function pickFile(file: File | undefined) {
    if (!file || !file.type.startsWith('image/')) return;
    onFileSelect(file);
  }

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload garment photo"
        data-testid="garment-image-dropzone"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          pickFile(e.dataTransfer.files[0]);
        }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={cn(
          'relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors',
          dragOver ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-primary/50',
          previewSrc && 'min-h-[8rem]',
        )}
      >
        {previewSrc ? (
          previewSrc.startsWith('blob:') ? (
            // eslint-disable-next-line @next/next/no-img-element -- local blob preview before upload
            <img src={previewSrc} alt={previewAlt} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <Image
              src={previewSrc}
              alt={previewAlt}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 320px"
            />
          )
        ) : (
          <>
            <Upload className="mb-2 h-7 w-7 text-muted-foreground" aria-hidden />
            <p className="text-sm font-medium">Drop photo or click to upload</p>
            <p className="mt-1 text-xs text-muted-foreground">JPEG, PNG, WebP up to 5 MB</p>
          </>
        )}
        {uploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Uploading" />
          </div>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}

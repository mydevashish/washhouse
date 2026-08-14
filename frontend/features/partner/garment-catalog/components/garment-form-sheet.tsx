'use client';

import { ChevronDown, ChevronUp, Loader2, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { GarmentImageDropzone } from '@/features/partner/garment-catalog/components/garment-image-dropzone';
import { usePartnerGarmentCatalogMutations } from '@/features/partner/garment-catalog/hooks/use-partner-garment-catalog-mutations';
import {
  formRatesToApiPayload,
  garmentRatesToFormValues,
  GARMENT_PRIMARY_SERVICE_TYPES,
  GARMENT_SECONDARY_SERVICE_TYPES,
  resolveGarmentCatalogPhoto,
} from '@/features/partner/garment-catalog/lib/garment-catalog-display';
import { uploadStorefrontImage } from '@/services/storefront';
import {
  GARMENT_CATEGORIES,
  GARMENT_SERVICE_TYPES,
  garmentServiceTypeLabel,
  type GarmentCatalogItem,
  type GarmentCategory,
  type GarmentServiceType,
} from '@/services/partner-garment-catalog';

type GarmentFormMode = 'create' | 'edit';

type FormState = {
  name: string;
  garment_code: string;
  category: GarmentCategory;
  is_visible: boolean;
  rates: Record<GarmentServiceType, string>;
};

const EMPTY_RATES = Object.fromEntries(
  GARMENT_SERVICE_TYPES.map((t) => [t, '']),
) as Record<GarmentServiceType, string>;

function defaultFormState(category: GarmentCategory = 'men'): FormState {
  return {
    name: '',
    garment_code: '',
    category,
    is_visible: true,
    rates: { ...EMPTY_RATES },
  };
}

function formFromItem(item: GarmentCatalogItem): FormState {
  return {
    name: item.name,
    garment_code: item.garment_code,
    category: item.category,
    is_visible: item.is_visible,
    rates: garmentRatesToFormValues(item.rates),
  };
}

export function GarmentFormSheet({
  open,
  mode,
  item,
  defaultCategory,
  onOpenChange,
  onDelete,
}: {
  open: boolean;
  mode: GarmentFormMode;
  item?: GarmentCatalogItem | null;
  defaultCategory?: GarmentCategory;
  onOpenChange: (open: boolean) => void;
  onDelete?: (item: GarmentCatalogItem) => void;
}) {
  const { createM, updateM, uploadImageM } = usePartnerGarmentCatalogMutations();
  const [form, setForm] = useState<FormState>(() => defaultFormState(defaultCategory));
  const [moreOpen, setMoreOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewOverride, setPreviewOverride] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const saving = createM.isPending || updateM.isPending || uploadingImage || uploadImageM.isPending;

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && item) {
      setForm(formFromItem(item));
      setMoreOpen(GARMENT_SECONDARY_SERVICE_TYPES.some((t) => item.rates[t]?.price_inr));
    } else {
      setForm(defaultFormState(defaultCategory ?? 'men'));
      setMoreOpen(false);
    }
    setPendingFile(null);
    setPreviewOverride(null);
  }, [open, mode, item, defaultCategory]);

  const previewPhoto = useMemo(() => {
    if (previewOverride) return { src: previewOverride, alt: form.name || 'Garment preview' };
    if (mode === 'edit' && item) return resolveGarmentCatalogPhoto(item);
    return null;
  }, [previewOverride, mode, item, form.name]);

  function handleFileSelect(file: File) {
    setPendingFile(file);
    setPreviewOverride(URL.createObjectURL(file));
  }

  function handleOpenChange(next: boolean) {
    if (previewOverride?.startsWith('blob:')) URL.revokeObjectURL(previewOverride);
    onOpenChange(next);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.garment_code.trim()) {
      toast.error('Name and garment code are required');
      return;
    }

    const rates = formRatesToApiPayload(form.rates);
    setUploadingImage(true);
    try {
      let imageUrl: string | null | undefined = item?.image_url ?? null;

      if (pendingFile) {
        if (mode === 'edit' && item) {
          await uploadImageM.mutateAsync({ id: item.id, file: pendingFile });
          imageUrl = undefined;
        } else {
          imageUrl = await uploadStorefrontImage(pendingFile);
        }
      }

      if (mode === 'create') {
        await createM.mutateAsync({
          name: form.name.trim(),
          garment_code: form.garment_code.trim(),
          category: form.category,
          is_visible: form.is_visible,
          rates,
          ...(imageUrl ? { image_url: imageUrl } : {}),
        });
      } else if (item) {
        await updateM.mutateAsync({
          id: item.id,
          input: {
            name: form.name.trim(),
            garment_code: form.garment_code.trim(),
            category: form.category,
            is_visible: form.is_visible,
            rates,
            ...(imageUrl ? { image_url: imageUrl } : {}),
          },
        });
      }
      handleOpenChange(false);
    } catch {
      // toast handled in mutations / upload
    } finally {
      setUploadingImage(false);
    }
  }

  function renderRateField(type: GarmentServiceType) {
    const id = `garment-rate-${type}`;
    return (
      <div key={type} className="space-y-1">
        <Label htmlFor={id} className="text-xs">
          {garmentServiceTypeLabel(type)}
        </Label>
        <Input
          id={id}
          type="number"
          min={0}
          step={1}
          className="min-h-9"
          placeholder="—"
          data-testid={id}
          value={form.rates[type]}
          onChange={(e) =>
            setForm((f) => ({ ...f, rates: { ...f.rates, [type]: e.target.value } }))
          }
        />
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        data-testid="garment-form-sheet"
        className="max-h-[min(90vh,100%)] overflow-y-auto sm:max-w-xl"
      >
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add garment' : 'Edit garment'}</DialogTitle>
          <DialogDescription>
            Set counter prices per service type. Leave blank if not offered.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <GarmentImageDropzone
            previewSrc={previewPhoto?.src}
            previewAlt={(previewPhoto?.alt ?? form.name) || 'Garment'}
            uploading={uploadingImage || uploadImageM.isPending}
            onFileSelect={handleFileSelect}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="garment-form-name">Garment name</Label>
              <Input
                id="garment-form-name"
                className="min-h-9"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="garment-form-code">Garment code</Label>
              <Input
                id="garment-form-code"
                className="min-h-9 font-mono"
                value={form.garment_code}
                onChange={(e) => setForm((f) => ({ ...f, garment_code: e.target.value.toUpperCase() }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="garment-form-category">Category</Label>
              <Select
                id="garment-form-category"
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value as GarmentCategory }))
                }
              >
                {GARMENT_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Service prices (INR)</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {GARMENT_PRIMARY_SERVICE_TYPES.map(renderRateField)}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1 px-0 text-muted-foreground"
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
            >
              {moreOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              More services
            </Button>
            {moreOpen ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {GARMENT_SECONDARY_SERVICE_TYPES.map(renderRateField)}
              </div>
            ) : null}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_visible}
              onChange={(e) => setForm((f) => ({ ...f, is_visible: e.target.checked }))}
              data-testid="garment-form-visible"
            />
            Show at counter (visible to staff)
          </label>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {mode === 'edit' && item && onDelete ? (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              data-testid="garment-form-delete-btn"
              onClick={() => onDelete(item)}
            >
              <Trash2 className="mr-1 h-4 w-4" aria-hidden />
              Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" disabled={saving} onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={saving}
              data-testid="garment-form-save-btn"
              onClick={() => void handleSave()}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : 'Save'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

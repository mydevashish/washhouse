'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

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
import { usePartnerGarmentCatalogMutations } from '@/features/partner/garment-catalog/hooks/use-partner-garment-catalog-mutations';
import {
  GARMENT_CATEGORIES,
  type GarmentBulkDeleteInput,
  type GarmentCategory,
} from '@/services/partner-garment-catalog';

export type GarmentBulkDeleteMode = 'selected' | 'category' | 'all';

export function GarmentBulkDeleteDialog({
  open,
  onOpenChange,
  selectedIds,
  selectedCategory,
  totalCount,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  selectedCategory?: GarmentCategory;
  totalCount: number;
  onSuccess?: () => void;
}) {
  const { bulkDeleteM } = usePartnerGarmentCatalogMutations();
  const [mode, setMode] = useState<GarmentBulkDeleteMode>('selected');
  const [category, setCategory] = useState<GarmentCategory>('men');
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (!open) return;
    if (selectedIds.length > 0) setMode('selected');
    else if (selectedCategory) {
      setMode('category');
      setCategory(selectedCategory);
    } else setMode('category');
    setConfirmText('');
  }, [open, selectedIds.length, selectedCategory]);

  const deleteCount = useMemo(() => {
    if (mode === 'selected') return selectedIds.length;
    if (mode === 'category') return null;
    return totalCount;
  }, [mode, selectedIds.length, totalCount]);

  const confirmDisabled =
    bulkDeleteM.isPending ||
    (mode === 'selected' && selectedIds.length === 0) ||
    (mode === 'all' && confirmText !== 'DELETE');

  async function handleConfirm() {
    let payload: GarmentBulkDeleteInput;
    if (mode === 'selected') {
      payload = { ids: selectedIds };
    } else if (mode === 'category') {
      payload = { category };
    } else {
      payload = { all: true, confirm: 'DELETE' };
    }
    await bulkDeleteM.mutateAsync(payload);
    onOpenChange(false);
    onSuccess?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="bulk-delete-dialog" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk delete garments</DialogTitle>
          <DialogDescription>
            Removed garments can be re-imported from Excel. This cannot be undone from the UI.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Delete mode</legend>
            <label className="flex cursor-pointer items-start gap-2 text-sm">
              <input
                type="radio"
                name="bulk-delete-mode"
                checked={mode === 'selected'}
                disabled={selectedIds.length === 0}
                onChange={() => setMode('selected')}
                data-testid="bulk-delete-mode-selected"
              />
              Selected rows ({selectedIds.length})
            </label>
            <label className="flex cursor-pointer items-start gap-2 text-sm">
              <input
                type="radio"
                name="bulk-delete-mode"
                checked={mode === 'category'}
                onChange={() => setMode('category')}
                data-testid="bulk-delete-mode-category"
              />
              By category
            </label>
            <label className="flex cursor-pointer items-start gap-2 text-sm">
              <input
                type="radio"
                name="bulk-delete-mode"
                checked={mode === 'all'}
                onChange={() => setMode('all')}
                data-testid="bulk-delete-mode-all"
              />
              Delete entire catalog
            </label>
          </fieldset>

          {mode === 'category' ? (
            <div className="space-y-1">
              <Label htmlFor="bulk-delete-category">Category</Label>
              <Select
                id="bulk-delete-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as GarmentCategory)}
                data-testid="bulk-delete-category-select"
              >
                {GARMENT_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}

          {mode === 'all' ? (
            <div className="space-y-1">
              <Label htmlFor="bulk-delete-confirm">Type DELETE to confirm</Label>
              <Input
                id="bulk-delete-confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                data-testid="bulk-delete-confirm-input"
              />
            </div>
          ) : null}

          <p className="text-sm text-muted-foreground" data-testid="bulk-delete-count">
            {mode === 'selected' && deleteCount != null
              ? `${deleteCount} garment${deleteCount === 1 ? '' : 's'} will be removed.`
              : null}
            {mode === 'category'
              ? `All garments in the selected category will be removed.`
              : null}
            {mode === 'all'
              ? `All ${totalCount} garments in your catalog will be removed.`
              : null}
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" disabled={bulkDeleteM.isPending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={confirmDisabled}
            data-testid="bulk-delete-confirm-btn"
            onClick={() => void handleConfirm()}
          >
            {bulkDeleteM.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { Download, Eye, Plus, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { PARTNER_BTN } from '@/features/partner/lib/partner-compact';
import { downloadGarmentTemplate } from '@/services/partner-garment-catalog';

type GarmentCatalogToolbarProps = {
  onAddGarment?: () => void;
  onBulkUpload?: () => void;
  onBulkDelete?: () => void;
  onMakeAllVisible?: () => void;
  makeAllVisibleDisabled?: boolean;
  downloading?: boolean;
};

export function GarmentCatalogToolbar({
  onAddGarment,
  onBulkUpload,
  onBulkDelete,
  onMakeAllVisible,
  makeAllVisibleDisabled = false,
  downloading = false,
}: GarmentCatalogToolbarProps) {
  async function handleDownloadTemplate() {
    try {
      await downloadGarmentTemplate();
      toast.success('Template downloaded');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not download template';
      toast.error(message);
    }
  }

  return (
    <div
      className="flex flex-wrap gap-2"
      data-testid="garment-catalog-toolbar"
    >
      <Button
        type="button"
        variant="default"
        className={`${PARTNER_BTN} gap-1.5`}
        data-testid="bulk-upload-btn"
        onClick={() => {
          if (onBulkUpload) onBulkUpload();
          else toast.message('Bulk upload wizard coming next');
        }}
      >
        <Upload className="h-4 w-4" aria-hidden />
        Bulk upload
      </Button>
      <Button
        type="button"
        variant="outline"
        className={`${PARTNER_BTN} gap-1.5`}
        data-testid="download-template-btn"
        disabled={downloading}
        onClick={() => void handleDownloadTemplate()}
      >
        <Download className="h-4 w-4" aria-hidden />
        Download template
      </Button>
      <Button
        type="button"
        variant="outline"
        className={`${PARTNER_BTN} gap-1.5`}
        data-testid="make-all-visible-btn"
        disabled={makeAllVisibleDisabled}
        onClick={() => {
          if (onMakeAllVisible) onMakeAllVisible();
        }}
      >
        <Eye className="h-4 w-4" aria-hidden />
        All visible
      </Button>
      <Button
        type="button"
        variant="outline"
        className={`${PARTNER_BTN} gap-1.5`}
        data-testid="bulk-delete-btn"
        onClick={() => {
          if (onBulkDelete) onBulkDelete();
          else toast.message('Bulk delete dialog coming next');
        }}
      >
        <Trash2 className="h-4 w-4" aria-hidden />
        Bulk delete
      </Button>
      <Button
        type="button"
        className={`${PARTNER_BTN} gap-1.5 sm:ml-auto`}
        data-testid="add-garment-btn"
        onClick={() => {
          if (onAddGarment) onAddGarment();
          else toast.message('Add garment form coming next');
        }}
      >
        <Plus className="h-4 w-4" aria-hidden />
        Add garment
      </Button>
    </div>
  );
}

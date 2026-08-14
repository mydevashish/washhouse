'use client';

import { Download, Plus, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { downloadGarmentTemplate } from '@/services/partner-garment-catalog';

type GarmentCatalogToolbarProps = {
  onAddGarment?: () => void;
  onBulkUpload?: () => void;
  onBulkDelete?: () => void;
  downloading?: boolean;
};

export function GarmentCatalogToolbar({
  onAddGarment,
  onBulkUpload,
  onBulkDelete,
  downloading = false,
}: GarmentCatalogToolbarProps) {
  async function handleDownloadTemplate() {
    try {
      await downloadGarmentTemplate();
      toast.success('Template downloaded');
    } catch {
      toast.error('Could not download template');
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
        className="h-9 gap-1.5"
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
        className="h-9 gap-1.5"
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
        className="h-9 gap-1.5"
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
        className="h-9 gap-1.5 sm:ml-auto"
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

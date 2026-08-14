'use client';

import { motion, useReducedMotion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
} from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
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
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { usePartnerGarmentCatalogMutations } from '@/features/partner/garment-catalog/hooks/use-partner-garment-catalog-mutations';
import {
  downloadImportErrorCsv,
  fetchExistingGarmentCodes,
  formatImportRowPrices,
  GARMENT_IMPORT_ACCEPT,
  isGarmentImportFile,
  isGarmentImportUpdate,
} from '@/features/partner/garment-catalog/lib/garment-import-export';
import {
  downloadGarmentTemplate,
  type GarmentImportConfirmResult,
  type GarmentImportMode,
  type GarmentImportPreviewResult,
} from '@/services/partner-garment-catalog';
import { cn } from '@/lib/utils';

type WizardStep = 'upload' | 'preview' | 'result';

const EASE = [0.16, 1, 0.3, 1] as const;

function StepPanel({ stepKey, children }: { stepKey: string; children: ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <div>{children}</div>;
  return (
    <motion.div
      key={stepKey}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.22, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

export function GarmentBulkUploadDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { previewImportM, confirmImportM } = usePartnerGarmentCatalogMutations();

  const [step, setStep] = useState<WizardStep>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<GarmentImportPreviewResult | null>(null);
  const [existingCodes, setExistingCodes] = useState<Set<string>>(new Set());
  const [skipInvalid, setSkipInvalid] = useState(true);
  const [importMode, setImportMode] = useState<GarmentImportMode>('upsert');
  const [result, setResult] = useState<GarmentImportConfirmResult | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  function reset() {
    setStep('upload');
    setDragOver(false);
    setFileName(null);
    setPreview(null);
    setExistingCodes(new Set());
    setSkipInvalid(true);
    setImportMode('upsert');
    setResult(null);
    setLoadingPreview(false);
  }

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
    if (!next) reset();
  }

  async function runPreview(file: File) {
    if (!isGarmentImportFile(file)) {
      toast.error('Use .xls, .xlsx, or .csv');
      return;
    }
    setLoadingPreview(true);
    setFileName(file.name);
    try {
      const [previewResult, codes] = await Promise.all([
        previewImportM.mutateAsync(file),
        fetchExistingGarmentCodes(),
      ]);
      setPreview(previewResult);
      setExistingCodes(codes);
      setStep('preview');
    } catch {
      setFileName(null);
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleConfirm() {
    if (!preview) return;
    if (!skipInvalid && preview.summary.error_count > 0) {
      toast.error('Fix invalid rows or choose to skip them');
      return;
    }
    try {
      const confirmResult = await confirmImportM.mutateAsync({
        preview_id: preview.preview_id,
        mode: importMode,
        skip_invalid: skipInvalid,
      });
      setResult(confirmResult);
      setStep('result');
      toast.success(`Imported ${confirmResult.imported_count} garments`);
    } catch {
      // toast from mutation
    }
  }

  const previewRows = [
    ...(preview?.valid_rows.map((row) => ({ kind: 'valid' as const, row })) ?? []),
    ...(preview?.error_rows.map((row) => ({ kind: 'error' as const, row })) ?? []),
  ].sort((a, b) => a.row.row_number - b.row.row_number);

  const confirmDisabled =
    !preview ||
    confirmImportM.isPending ||
    (!skipInvalid && (preview.summary.error_count ?? 0) > 0) ||
    preview.summary.valid_count === 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        data-testid="bulk-upload-dialog"
        className="max-h-[min(90vh,100%)] overflow-y-auto sm:max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle>Bulk upload rate card</DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Upload your Excel or CSV export — same columns as your POS.'}
            {step === 'preview' && 'Review rows before importing into your catalog.'}
            {step === 'result' && 'Import complete.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' ? (
          <StepPanel stepKey="upload">
            <div
              role="button"
              tabIndex={0}
              aria-label="Upload rate card file"
              data-testid="bulk-upload-dropzone"
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) void runPreview(file);
              }}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  inputRef.current?.click();
                }
              }}
              className={cn(
                'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors',
                dragOver ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-primary/50',
              )}
            >
              {loadingPreview ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Previewing file" />
              ) : (
                <>
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" aria-hidden />
                  <p className="text-sm font-medium">Drop .xls, .xlsx, or .csv here</p>
                  <p className="mt-1 text-xs text-muted-foreground">Or click to choose a file</p>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                accept={GARMENT_IMPORT_ACCEPT}
                className="hidden"
                data-testid="bulk-upload-file-input"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void runPreview(file);
                  e.target.value = '';
                }}
              />
            </div>
            <button
              type="button"
              className="mt-3 text-sm font-medium text-primary underline-offset-4 hover:underline"
              onClick={() => void downloadGarmentTemplate().then(() => toast.success('Template downloaded'))}
            >
              Download template
            </button>
          </StepPanel>
        ) : null}

        {step === 'preview' && preview ? (
          <StepPanel stepKey="preview">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" data-testid="bulk-upload-summary">
              <SummaryChip label="Valid" value={preview.summary.valid_count} />
              <SummaryChip label="Errors" value={preview.summary.error_count} tone="danger" />
              <SummaryChip label="New" value={preview.summary.create_count} tone="success" />
              <SummaryChip label="Updates" value={preview.summary.update_count} tone="warn" />
            </div>

            {fileName ? (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden />
                {fileName}
              </p>
            ) : null}

            <div className="mt-3 max-h-56 overflow-auto rounded-lg border border-border/60">
              <table className="w-full min-w-[28rem] text-xs">
                <thead className="sticky top-0 bg-muted/80 text-left text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-2 py-1.5 font-medium">
                      #
                    </th>
                    <th scope="col" className="px-2 py-1.5 font-medium">
                      Status
                    </th>
                    <th scope="col" className="px-2 py-1.5 font-medium">
                      Garment
                    </th>
                    <th scope="col" className="px-2 py-1.5 font-medium">
                      Code
                    </th>
                    <th scope="col" className="px-2 py-1.5 font-medium">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map(({ kind, row }) => {
                    if (kind === 'error') {
                      return (
                        <tr
                          key={`err-${row.row_number}`}
                          className="border-t border-border/40 bg-destructive/5"
                          data-testid={`import-row-error-${row.row_number}`}
                        >
                          <td className="px-2 py-1.5 tabular-nums">{row.row_number}</td>
                          <td className="px-2 py-1.5">
                            <AlertCircle className="h-4 w-4 text-destructive" aria-label="Error" />
                          </td>
                          <td className="px-2 py-1.5">{row.name ?? '—'}</td>
                          <td className="px-2 py-1.5 font-mono">{row.garment_code ?? '—'}</td>
                          <td className="px-2 py-1.5 text-destructive">{row.errors.join('; ')}</td>
                        </tr>
                      );
                    }

                    const isUpdate = isGarmentImportUpdate(row.garment_code, existingCodes);
                    return (
                      <tr
                        key={`ok-${row.row_number}`}
                        className={cn(
                          'border-t border-border/40',
                          isUpdate
                            ? 'bg-amber-500/5 dark:bg-amber-500/10'
                            : 'bg-emerald-500/5 dark:bg-emerald-500/10',
                        )}
                        data-testid={`import-row-valid-${row.row_number}`}
                      >
                        <td className="px-2 py-1.5 tabular-nums">{row.row_number}</td>
                        <td className="px-2 py-1.5">
                          <CheckCircle2
                            className={cn(
                              'h-4 w-4',
                              isUpdate
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-emerald-600 dark:text-emerald-400',
                            )}
                            aria-label={isUpdate ? 'Update' : 'New'}
                          />
                        </td>
                        <td className="px-2 py-1.5">{row.name}</td>
                        <td className="px-2 py-1.5 font-mono">{row.garment_code}</td>
                        <td className="px-2 py-1.5">
                          <span className={cn('mr-2 font-medium', isUpdate ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400')}>
                            {isUpdate ? 'Update' : 'New'}
                          </span>
                          {formatImportRowPrices(row.rates)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 space-y-3">
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Invalid rows</legend>
                <label className="flex cursor-pointer items-start gap-2 text-sm">
                  <input
                    type="radio"
                    name="skip-invalid"
                    checked={skipInvalid}
                    onChange={() => setSkipInvalid(true)}
                    data-testid="import-skip-invalid"
                  />
                  Skip invalid rows and import valid ones
                </label>
                <label className="flex cursor-pointer items-start gap-2 text-sm">
                  <input
                    type="radio"
                    name="skip-invalid"
                    checked={!skipInvalid}
                    onChange={() => setSkipInvalid(false)}
                    data-testid="import-cancel-on-errors"
                  />
                  Cancel if any errors (fix file first)
                </label>
              </fieldset>

              <div className="space-y-1">
                <Label htmlFor="import-mode">Import mode</Label>
                <Select
                  id="import-mode"
                  value={importMode}
                  onChange={(e) => setImportMode(e.target.value as GarmentImportMode)}
                  data-testid="import-mode-select"
                >
                  <option value="upsert">Upsert by garment code (default)</option>
                  <option value="replace_categories_in_file">Replace categories in file</option>
                  <option value="replace_all">Replace entire catalog (danger)</option>
                </Select>
              </div>
            </div>
          </StepPanel>
        ) : null}

        {step === 'result' && result ? (
          <StepPanel stepKey="result">
            <div
              className="rounded-xl border border-border/60 bg-muted/20 p-4"
              data-testid="bulk-upload-result"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <p className="text-lg font-semibold tabular-nums">{result.imported_count} imported</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>{result.created_count} new garments</li>
                <li>{result.updated_count} updated</li>
                {result.skipped_error_count > 0 ? (
                  <li>{result.skipped_error_count} invalid rows skipped</li>
                ) : null}
              </ul>
              {preview && preview.error_rows.length > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 h-8 gap-1.5"
                  data-testid="download-import-errors-btn"
                  onClick={() => downloadImportErrorCsv(preview.error_rows)}
                >
                  <Download className="h-3.5 w-3.5" aria-hidden />
                  Download error rows (CSV)
                </Button>
              ) : null}
            </div>
          </StepPanel>
        ) : null}

        <DialogFooter className="gap-2">
          {step === 'preview' ? (
            <Button type="button" variant="outline" onClick={() => setStep('upload')}>
              Back
            </Button>
          ) : null}
          {step === 'preview' ? (
            <Button
              type="button"
              disabled={confirmDisabled}
              data-testid="import-confirm-btn"
              onClick={() => void handleConfirm()}
            >
              {confirmImportM.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                'Import valid rows'
              )}
            </Button>
          ) : null}
          {step === 'result' ? (
            <Button type="button" data-testid="bulk-upload-view-catalog-btn" onClick={() => handleOpenChange(false)}>
              View catalog
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SummaryChip({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: number;
  tone?: 'default' | 'success' | 'warn' | 'danger';
}) {
  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2 text-center',
        tone === 'success' && 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10',
        tone === 'warn' && 'border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10',
        tone === 'danger' && 'border-destructive/30 bg-destructive/5',
        tone === 'default' && 'border-border/60 bg-muted/20',
      )}
    >
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-[10px] text-muted-foreground sm:text-xs">{label}</p>
    </div>
  );
}

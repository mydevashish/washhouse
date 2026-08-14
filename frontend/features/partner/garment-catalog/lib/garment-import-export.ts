import {
  listPartnerGarments,
  type GarmentImportErrorRow,
  type GarmentImportPreviewRow,
} from '@/services/partner-garment-catalog';

/** Load all active garment codes for import preview row status (new vs update). */
export async function fetchExistingGarmentCodes(): Promise<Set<string>> {
  const codes = new Set<string>();
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const data = await listPartnerGarments({ page, page_size: 100 });
    for (const item of data.items) {
      codes.add(item.garment_code.trim().toLowerCase());
    }
    hasNext = data.has_next;
    page += 1;
  }

  return codes;
}

export function isGarmentImportUpdate(garmentCode: string, existingCodes: Set<string>): boolean {
  return existingCodes.has(garmentCode.trim().toLowerCase());
}

export function formatImportRowPrices(rates: GarmentImportPreviewRow['rates']): string {
  const parts = Object.entries(rates)
    .filter(([, value]) => value > 0)
    .slice(0, 3)
    .map(([key, value]) => `${key}: ₹${value}`);
  return parts.length > 0 ? parts.join(' · ') : '—';
}

export function downloadImportErrorCsv(
  rows: GarmentImportErrorRow[],
  filename = 'garment-import-errors.csv',
): void {
  const header = 'row_number,garment_code,name,errors';
  const lines = rows.map((row) => {
    const code = row.garment_code ?? '';
    const name = row.name ?? '';
    const errors = row.errors.join('; ').replace(/"/g, '""');
    return `${row.row_number},"${code}","${name}","${errors}"`;
  });
  const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export const GARMENT_IMPORT_ACCEPT =
  '.xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv';

export function isGarmentImportFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith('.xls') || name.endsWith('.xlsx') || name.endsWith('.csv');
}

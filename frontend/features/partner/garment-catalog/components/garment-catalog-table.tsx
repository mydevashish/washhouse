'use client';

import { ArrowDown, ArrowUp, ArrowUpDown, Eye, EyeOff, Pencil } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { visibleGarmentServiceColumns } from '@/features/partner/garment-catalog/lib/garment-catalog-display';
import {
  garmentServiceTypeLabel,
  type GarmentCatalogItem,
  type GarmentServiceType,
} from '@/services/partner-garment-catalog';

type SortKey = 'name' | 'garment_code' | GarmentServiceType;
type SortDir = 'asc' | 'desc';

function SortButton({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
}) {
  const Icon = active ? (dir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <button
      type="button"
      className="inline-flex items-center gap-0.5 font-medium hover:text-foreground"
      onClick={onClick}
    >
      {label}
      <Icon className="h-3 w-3" aria-hidden />
    </button>
  );
}

function compareItems(a: GarmentCatalogItem, b: GarmentCatalogItem, key: SortKey, dir: SortDir) {
  let av: string | number = '';
  let bv: string | number = '';
  if (key === 'name') {
    av = a.name.toLowerCase();
    bv = b.name.toLowerCase();
  } else if (key === 'garment_code') {
    av = a.garment_code.toLowerCase();
    bv = b.garment_code.toLowerCase();
  } else {
    av = Number(a.rates[key]?.price_inr ?? 0);
    bv = Number(b.rates[key]?.price_inr ?? 0);
  }
  if (av < bv) return dir === 'asc' ? -1 : 1;
  if (av > bv) return dir === 'asc' ? 1 : -1;
  return 0;
}

export function GarmentCatalogTable({
  items,
  togglingId,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onToggleVisibility,
}: {
  items: GarmentCatalogItem[];
  togglingId?: string | null;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onEdit: (item: GarmentCatalogItem) => void;
  onToggleVisibility: (item: GarmentCatalogItem) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const serviceColumns = useMemo(() => visibleGarmentServiceColumns(items), [items]);

  const sorted = useMemo(
    () => [...items].sort((a, b) => compareItems(a, b, sortKey, sortDir)),
    [items, sortKey, sortDir],
  );

  const allSelected = sorted.length > 0 && sorted.every((item) => selectedIds.has(item.id));
  const someSelected = sorted.some((item) => selectedIds.has(item.id));

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  return (
    <div className="hidden overflow-x-auto sm:block" data-testid="garment-catalog-table">
      <table className="w-full min-w-[40rem] text-sm">
        <thead className="border-b border-border/60 bg-muted/30 text-left text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="w-10 px-2 py-2">
              <input
                type="checkbox"
                aria-label="Select all on page"
                data-testid="garment-catalog-select-all"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = !allSelected && someSelected;
                }}
                onChange={(e) => onToggleSelectAll(e.target.checked)}
              />
            </th>
            <th scope="col" className="px-3 py-2">
              <SortButton
                label="Garment"
                active={sortKey === 'name'}
                dir={sortDir}
                onClick={() => toggleSort('name')}
              />
            </th>
            <th scope="col" className="px-3 py-2">
              <SortButton
                label="Code"
                active={sortKey === 'garment_code'}
                dir={sortDir}
                onClick={() => toggleSort('garment_code')}
              />
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              Category
            </th>
            {serviceColumns.map((type) => (
              <th key={type} scope="col" className="px-3 py-2">
                <SortButton
                  label={garmentServiceTypeLabel(type)}
                  active={sortKey === type}
                  dir={sortDir}
                  onClick={() => toggleSort(type)}
                />
              </th>
            ))}
            <th scope="col" className="px-3 py-2 font-medium">
              Visible
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((item) => (
            <tr
              key={item.id}
              className="border-b border-border/40 last:border-0"
              data-testid={`garment-catalog-row-${item.garment_code}`}
                >
                  <td className="px-2 py-2.5">
                    <input
                      type="checkbox"
                      aria-label={`Select ${item.name}`}
                      data-testid={`garment-select-${item.garment_code}`}
                      checked={selectedIds.has(item.id)}
                      onChange={() => onToggleSelect(item.id)}
                    />
                  </td>
                  <td className="px-3 py-2.5 font-medium">{item.name}</td>
              <td className="px-3 py-2.5 font-mono text-xs">{item.garment_code}</td>
              <td className="px-3 py-2.5 capitalize">{item.category}</td>
              {serviceColumns.map((type) => (
                <td key={type} className="px-3 py-2.5 tabular-nums">
                  {item.rates[type]?.price_inr ? `₹${item.rates[type]?.price_inr}` : '—'}
                </td>
              ))}
              <td className="px-3 py-2.5">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 gap-1 px-2"
                  data-testid={`garment-visibility-toggle-${item.garment_code}`}
                  disabled={togglingId === item.id}
                  aria-pressed={item.is_visible}
                  aria-label={item.is_visible ? 'Hide at counter' : 'Show at counter'}
                  onClick={() => onToggleVisibility(item)}
                >
                  {item.is_visible ? (
                    <Eye className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5" aria-hidden />
                  )}
                </Button>
              </td>
              <td className="px-3 py-2.5 text-right">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 gap-1"
                  data-testid={`garment-edit-btn-${item.garment_code}`}
                  onClick={() => onEdit(item)}
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                  Edit
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

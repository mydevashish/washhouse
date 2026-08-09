'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
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
import { normalizeServiceCategory } from '@/features/discover/detail/lib/normalize-service-category';
import {
  partnerCategoryOptionFromName,
  resolvePartnerServiceCategorySlug,
  type PartnerServiceCategoryOption,
} from '@/features/partner/lib/partner-service-category-options';

type Props = {
  id?: string;
  label?: string;
  value: string;
  onChange: (slug: string) => void;
  options: PartnerServiceCategoryOption[];
  onCreateOption: (option: PartnerServiceCategoryOption) => void;
  selectDisabled?: boolean;
};

export function PartnerServiceCategoryField({
  id,
  label = 'Category',
  value,
  onChange,
  options,
  onCreateOption,
  selectDisabled,
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');

  const selectValue = resolvePartnerServiceCategorySlug(value, options);

  function handleCreate() {
    const option = partnerCategoryOptionFromName(newName);
    if (!option) {
      toast.error('Enter a category name');
      return;
    }
    const exists = options.some(
      (o) => normalizeServiceCategory(o.slug) === normalizeServiceCategory(option.slug),
    );
    if (exists) {
      toast.error('That category is already in the list');
      onChange(option.slug);
      setNewName('');
      setDialogOpen(false);
      return;
    }
    onCreateOption(option);
    onChange(option.slug);
    setNewName('');
    setDialogOpen(false);
    toast.success(`Category "${option.name}" added`);
  }

  return (
    <>
      <div className="space-y-1">
        {label ? <Label htmlFor={id}>{label}</Label> : null}
        <div className="flex gap-2">
          <Select
            id={id}
            className="h-9 min-w-0 flex-1 text-sm"
            value={selectValue}
            disabled={selectDisabled}
            onChange={(e) => onChange(e.target.value)}
          >
            {options.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </Select>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            aria-label="Add new category"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setNewName('');
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New category</DialogTitle>
            <DialogDescription>
              Add a label for your catalog (for example “Corporate bulk” or “Leather care”). It is saved
              when you save the service.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="partner-new-category-name">Category name</Label>
            <Input
              id="partner-new-category-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Leather care"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreate();
                }
              }}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleCreate}>
              Add category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

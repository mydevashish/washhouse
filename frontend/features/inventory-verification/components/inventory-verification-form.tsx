'use client';

import { useEffect, useState } from 'react';
import { ClipboardList, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  INVENTORY_ITEM_LABELS,
  INVENTORY_ITEM_TYPES,
  emptyInventoryItems,
  inventoryFromLines,
  inventoryTotal,
  recordPartnerInventory,
  requestInventoryChange,
  type InventoryItems,
  type InventoryVerification,
} from '@/services/inventory-verification';

type InventoryVerificationFormProps = {
  orderId: string;
  verification: InventoryVerification | null;
  onSaved?: () => void;
  disabled?: boolean;
};

export function InventoryVerificationForm({
  orderId,
  verification,
  onSaved,
  disabled,
}: InventoryVerificationFormProps) {
  const isLocked = verification?.is_locked ?? false;
  const changePending = verification?.status === 'change_pending';
  const [items, setItems] = useState<InventoryItems>(emptyInventoryItems());
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [showChangeForm, setShowChangeForm] = useState(false);

  useEffect(() => {
    if (verification) {
      setItems(inventoryFromLines(verification.items));
    }
  }, [verification]);

  function setQty(type: keyof InventoryItems, value: string) {
    const n = Math.max(0, Math.min(500, Number.parseInt(value, 10) || 0));
    setItems((prev) => ({ ...prev, [type]: n }));
  }

  async function save() {
    if (inventoryTotal(items) < 1) {
      toast.error('Record at least one item');
      return;
    }
    setSaving(true);
    try {
      if (isLocked) {
        if (reason.trim().length < 10) {
          toast.error('Provide a reason (min 10 characters)');
          return;
        }
        await requestInventoryChange(orderId, items, reason.trim());
        toast.success('Change request submitted for admin approval');
      } else {
        await recordPartnerInventory(orderId, items);
        toast.success('Inventory recorded');
      }
      onSaved?.();
    } catch {
      toast.error('Could not save inventory');
    } finally {
      setSaving(false);
    }
  }

  if (changePending) {
    return (
      <Card className="rounded-2xl border-amber-500/30 ring-1 ring-amber-500/20">
        <CardContent className="p-4 text-sm text-muted-foreground">
          Inventory change pending admin approval. You cannot edit until reviewed.
        </CardContent>
      </Card>
    );
  }

  const readOnly = disabled || (isLocked && !showChangeForm);

  return (
    <Card className="rounded-2xl border-primary/30 ring-1 ring-primary/15">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardList className="h-5 w-5 text-primary" aria-hidden />
          Item inventory
        </CardTitle>
        <CardDescription>
          {isLocked
            ? 'Inventory is locked. Request admin approval to change counts.'
            : 'Record item counts at pickup before marking picked up.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {INVENTORY_ITEM_TYPES.map((type) => (
            <div key={type} className="space-y-1">
              <Label htmlFor={`inv-${orderId}-${type}`} className="text-xs">
                {INVENTORY_ITEM_LABELS[type]}
              </Label>
              <Input
                id={`inv-${orderId}-${type}`}
                type="number"
                min={0}
                max={500}
                inputMode="numeric"
                value={items[type]}
                disabled={readOnly || saving}
                onChange={(e) => setQty(type, e.target.value)}
                className="h-10 tabular-nums"
              />
            </div>
          ))}
        </div>

        <p className="text-sm font-medium">
          Total: <span className="tabular-nums">{inventoryTotal(items)}</span> items
        </p>

        {isLocked && !showChangeForm && (
          <Button type="button" variant="outline" className="w-full" onClick={() => setShowChangeForm(true)}>
            Request inventory change
          </Button>
        )}

        {isLocked && showChangeForm && (
          <div className="space-y-2">
            <Label htmlFor={`inv-reason-${orderId}`}>Reason for change</Label>
            <Textarea
              id={`inv-reason-${orderId}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why counts need to change…"
              rows={3}
              disabled={saving}
            />
          </div>
        )}

        {(!isLocked || showChangeForm) && (
          <Button type="button" className="min-h-[44px] w-full" disabled={disabled || saving} onClick={() => void save()}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Saving…
              </>
            ) : isLocked ? (
              'Submit change request'
            ) : (
              'Save inventory'
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

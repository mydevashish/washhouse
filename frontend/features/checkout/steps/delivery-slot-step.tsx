'use client';

import { InfoBanner } from '@/components/ui/info-banner';
import { SlotPicker } from '@/features/checkout/slot-picker';
import { formatSlotSummary, type TimeSlot } from '@/features/checkout/lib/slots';

type DeliverySlotStepProps = {
  slots: TimeSlot[];
  value: string;
  onChange: (id: string) => void;
  error?: string;
  pickupSummary: string | null;
  minHours: number;
};

export function DeliverySlotStep({
  slots,
  value,
  onChange,
  error,
  pickupSummary,
  minHours,
}: DeliverySlotStepProps) {
  return (
    <div className="space-y-4">
      {pickupSummary && (
        <InfoBanner variant="default" title="Pickup scheduled">
          {pickupSummary}. Delivery must be at least {minHours} hours after pickup based on your
          services.
        </InfoBanner>
      )}
      <p className="text-sm text-muted-foreground">
        When would you like your clothes back? Available slots update based on your pickup time.
      </p>
      <SlotPicker
        slots={slots}
        value={value}
        onChange={onChange}
        error={error}
        name="delivery-slot"
        emptyMessage="No delivery slots fit this pickup time. Go back and pick an earlier pickup."
      />
    </div>
  );
}

export { formatSlotSummary };

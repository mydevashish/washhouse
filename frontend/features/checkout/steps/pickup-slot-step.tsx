'use client';

import { SlotPicker } from '@/features/checkout/slot-picker';
import type { TimeSlot } from '@/features/checkout/lib/slots';

type PickupSlotStepProps = {
  slots: TimeSlot[];
  value: string;
  onChange: (id: string) => void;
  error?: string;
};

export function PickupSlotStep({ slots, value, onChange, error }: PickupSlotStepProps) {
  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        When should we collect your laundry? Pick a convenient window — most customers choose
        tomorrow morning.
      </p>
      <SlotPicker
        slots={slots}
        value={value}
        onChange={onChange}
        error={error}
        name="pickup-slot"
      />
    </div>
  );
}

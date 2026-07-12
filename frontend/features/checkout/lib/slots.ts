export type TimeSlot = {
  id: string;
  label: string;
  sublabel: string;
  startsAt: Date;
};

const PICKUP_WINDOWS = [
  { startHour: 9, endHour: 12, label: 'Morning', sublabel: '9 AM – 12 PM' },
  { startHour: 12, endHour: 15, label: 'Afternoon', sublabel: '12 PM – 3 PM' },
  { startHour: 17, endHour: 20, label: 'Evening', sublabel: '5 PM – 8 PM' },
] as const;

const DELIVERY_WINDOWS = [
  { startHour: 10, endHour: 13, label: 'Morning', sublabel: '10 AM – 1 PM' },
  { startHour: 14, endHour: 17, label: 'Afternoon', sublabel: '2 PM – 5 PM' },
  { startHour: 18, endHour: 21, label: 'Evening', sublabel: '6 PM – 9 PM' },
] as const;

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function slotAt(day: Date, hour: number): Date {
  const d = startOfDay(day);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function formatDayLabel(day: Date, today: Date): string {
  const t0 = startOfDay(today).getTime();
  const d0 = startOfDay(day).getTime();
  const diff = Math.round((d0 - t0) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return day.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function slotId(startsAt: Date): string {
  return startsAt.toISOString();
}

/** Pickup slots for the next 7 days (skips past windows today). */
export function buildPickupSlots(now = new Date()): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const minLeadMs = 60 * 60 * 1000;

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const day = new Date(now);
    day.setDate(day.getDate() + dayOffset);
    const dayLabel = formatDayLabel(day, now);

    for (const w of PICKUP_WINDOWS) {
      const startsAt = slotAt(day, w.startHour);
      if (startsAt.getTime() < now.getTime() + minLeadMs) continue;
      slots.push({
        id: slotId(startsAt),
        label: `${dayLabel} · ${w.label}`,
        sublabel: w.sublabel,
        startsAt,
      });
    }
  }

  return slots;
}

/** Delivery slots on or after pickup + minimum turnaround hours. */
export function buildDeliverySlots(
  pickupAt: Date,
  minHoursAfterPickup: number,
  now = new Date(),
): TimeSlot[] {
  const earliest = new Date(pickupAt);
  earliest.setHours(earliest.getHours() + minHoursAfterPickup);

  const slots: TimeSlot[] = [];
  const minLeadMs = 30 * 60 * 1000;

  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const day = new Date(now);
    day.setDate(day.getDate() + dayOffset);
    const dayLabel = formatDayLabel(day, now);

    for (const w of DELIVERY_WINDOWS) {
      const startsAt = slotAt(day, w.startHour);
      if (startsAt.getTime() < earliest.getTime()) continue;
      if (startsAt.getTime() < now.getTime() + minLeadMs) continue;
      slots.push({
        id: slotId(startsAt),
        label: `${dayLabel} · ${w.label}`,
        sublabel: w.sublabel,
        startsAt,
      });
    }
    if (slots.length >= 18) break;
  }

  return slots;
}

export function findSlot(slots: TimeSlot[], id: string | null): TimeSlot | undefined {
  if (!id) return undefined;
  return slots.find((s) => s.id === id);
}

export function formatSlotSummary(slot: TimeSlot): string {
  return slot.startsAt.toLocaleString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

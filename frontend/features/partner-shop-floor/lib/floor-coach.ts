import {
  PARTNER_FLOOR_COACH_ORDER_LIMIT,
  PARTNER_FLOOR_COACH_ORDERS_KEY,
} from '@/features/partner-shop-floor/types';

export type FloorCoachStep = 'customer' | 'wall' | 'confirm' | 'success' | 'home';

const STEP_COPY: Record<FloorCoachStep, { hinglish: string; english: string }> = {
  customer: {
    hinglish: 'Phone keypad se number dabao, phir naam',
    english: 'Enter phone on the big keypad, then name',
  },
  wall: {
    hinglish: 'Kapde ki photo pe tap — qty badhao',
    english: 'Tap clothing photos to add qty',
  },
  confirm: {
    hinglish: 'Check karo — Save order dabao',
    english: 'Review lines, then Save order',
  },
  success: {
    hinglish: 'Print Tags dabao — bag pe chipkao',
    english: 'Print tags and stick on the bag',
  },
  home: {
    hinglish: 'Naya Order se shuru karo',
    english: 'Start with New order',
  },
};

export function readCoachOrderCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem(PARTNER_FLOOR_COACH_ORDERS_KEY);
    const n = Number.parseInt(raw ?? '0', 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function writeCoachOrderCount(count: number): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      PARTNER_FLOOR_COACH_ORDERS_KEY,
      String(Math.max(0, Math.floor(count))),
    );
  } catch {
    /* ignore quota */
  }
}

/** Increment after a successful create; returns new count. */
export function recordCoachOrderCreated(): number {
  const next = readCoachOrderCount() + 1;
  writeCoachOrderCount(next);
  return next;
}

export function shouldShowFloorCoach(orderCount = readCoachOrderCount()): boolean {
  return orderCount < PARTNER_FLOOR_COACH_ORDER_LIMIT;
}

export function floorCoachCopy(step: FloorCoachStep): { hinglish: string; english: string } {
  return STEP_COPY[step];
}

export { PARTNER_FLOOR_COACH_ORDER_LIMIT };

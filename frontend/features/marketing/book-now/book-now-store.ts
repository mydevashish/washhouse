import { create } from 'zustand';

import type { BookNowServiceId } from '@/features/marketing/book-now/book-now-constants';

type BookNowState = {
  isOpen: boolean;
  /** Optional service pre-select when opened from a service card. */
  defaultService?: BookNowServiceId;
  open: (options?: { service?: BookNowServiceId }) => void;
  close: () => void;
  setOpen: (open: boolean) => void;
};

export const useBookNowStore = create<BookNowState>((set) => ({
  isOpen: false,
  defaultService: undefined,
  open: (options) =>
    set({
      isOpen: true,
      defaultService: options?.service,
    }),
  close: () => set({ isOpen: false, defaultService: undefined }),
  setOpen: (open) =>
    set(
      open
        ? { isOpen: true }
        : { isOpen: false, defaultService: undefined },
    ),
}));

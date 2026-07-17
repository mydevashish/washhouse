/**
 * Embla / JS-driven carousels (overflow hidden + drag).
 * Below lg: `touch-action: pan-y` so vertical page scroll is never trapped;
 * horizontal motion is handled by Embla, not native overflow scrolling.
 */
export const HORIZONTAL_SCROLL_TOUCH_CLASS = 'horizontal-scroll-touch';

/**
 * Native `overflow-x-auto` strips (scroll-snap carousels, chip rows).
 * Must allow horizontal pan — `HORIZONTAL_SCROLL_TOUCH_CLASS` alone blocks native swipe.
 * Uses `touch-action: manipulation` (pan-x + pan-y + pinch-zoom) so vertical page scroll still works.
 */
export const HORIZONTAL_SCROLL_NATIVE_CLASS = 'horizontal-scroll-native';

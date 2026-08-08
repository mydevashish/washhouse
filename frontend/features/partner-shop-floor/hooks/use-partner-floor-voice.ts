'use client';

import { useCallback } from 'react';

import {
  canSpeakFloorPrompt,
  speakFloorPrompt,
} from '@/features/partner-shop-floor/lib/floor-voice';
import { usePartnerFloorVoiceStore } from '@/features/partner-shop-floor/store/partner-floor-voice.store';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';
import { useStoreHydrated } from '@/lib/hooks/use-store-hydrated';

/** Opt-in Web Speech for Shop Floor; respects reduced motion + sound off. */
export function usePartnerFloorVoice(): {
  enabled: boolean;
  soundOff: boolean;
  hydrated: boolean;
  setEnabled: (enabled: boolean) => void;
  setSoundOff: (soundOff: boolean) => void;
  toggle: () => void;
  speak: (text: string) => boolean;
  canSpeak: boolean;
} {
  const hydrated = useStoreHydrated(usePartnerFloorVoiceStore);
  const enabled = usePartnerFloorVoiceStore((s) => s.enabled);
  const soundOff = usePartnerFloorVoiceStore((s) => s.soundOff);
  const setEnabled = usePartnerFloorVoiceStore((s) => s.setEnabled);
  const setSoundOff = usePartnerFloorVoiceStore((s) => s.setSoundOff);
  const toggle = usePartnerFloorVoiceStore((s) => s.toggle);
  const prefersReducedMotion = usePrefersReducedMotion();

  const gate = {
    settingEnabled: hydrated && enabled,
    prefersReducedMotion,
    soundOff: hydrated && soundOff,
  };

  const canSpeak = canSpeakFloorPrompt(gate);

  const speak = useCallback(
    (text: string) => speakFloorPrompt(text, gate),
    // gate fields are primitives — intentional
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gate.settingEnabled, gate.prefersReducedMotion, gate.soundOff],
  );

  return {
    enabled: hydrated ? enabled : false,
    soundOff: hydrated ? soundOff : false,
    hydrated,
    setEnabled,
    setSoundOff,
    toggle,
    speak,
    canSpeak,
  };
}

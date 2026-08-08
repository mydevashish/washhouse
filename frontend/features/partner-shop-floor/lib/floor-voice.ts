/**
 * Optional Web Speech one-liners for Shop Floor (low-literacy cue).
 * Gated by setting + reduced motion + sound-off preference.
 */

export const FLOOR_VOICE_SUCCESS = 'Order save हो गई';
export const FLOOR_VOICE_PRINT_TAGS = 'Tags print karo — bag pe chipkao';
export const FLOOR_VOICE_PRINT_BILL = 'Bill print ready hai';

export type FloorVoiceGate = {
  settingEnabled: boolean;
  prefersReducedMotion: boolean;
  /** Explicit sound-off (device / More toggle companion). */
  soundOff?: boolean;
};

export function canSpeakFloorPrompt(gate: FloorVoiceGate): boolean {
  if (!gate.settingEnabled) return false;
  if (gate.prefersReducedMotion) return false;
  if (gate.soundOff) return false;
  if (typeof window === 'undefined') return false;
  if (!('speechSynthesis' in window) || typeof window.speechSynthesis?.speak !== 'function') {
    return false;
  }
  return true;
}

/** Cancel any in-flight utterance, then speak one calm line. */
export function speakFloorPrompt(text: string, gate: FloorVoiceGate): boolean {
  if (!canSpeakFloorPrompt(gate) || !text.trim()) return false;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text.trim());
    utter.rate = 0.95;
    utter.pitch = 1;
    utter.volume = 0.85;
    // Prefer Hindi if available; otherwise browser default.
    const voices = window.speechSynthesis.getVoices();
    const hi = voices.find(
      (v) => v.lang?.toLowerCase().startsWith('hi') || v.lang?.toLowerCase().includes('hindi'),
    );
    if (hi) utter.voice = hi;
    window.speechSynthesis.speak(utter);
    return true;
  } catch {
    return false;
  }
}

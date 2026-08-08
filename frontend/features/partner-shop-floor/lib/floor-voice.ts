/**
 * Optional Web Speech one-liners for partner ops (create / print cues).
 * Gated by setting + reduced motion + sound-off preference.
 * English (en-IN) only — never prefer Hindi.
 */

export const FLOOR_VOICE_SUCCESS = 'Order saved';
export const FLOOR_VOICE_PRINT_TAGS = 'Print tags and stick them on the bag';
export const FLOOR_VOICE_PRINT_BILL = 'Bill is ready to print';

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

function pickEnglishIndiaVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const lower = (v: SpeechSynthesisVoice) => v.lang?.toLowerCase() ?? '';
  return (
    voices.find((v) => lower(v).startsWith('en-in')) ??
    voices.find((v) => lower(v).startsWith('en')) ??
    null
  );
}

/** Cancel any in-flight utterance, then speak one calm English line. */
export function speakFloorPrompt(text: string, gate: FloorVoiceGate): boolean {
  if (!canSpeakFloorPrompt(gate) || !text.trim()) return false;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text.trim());
    utter.lang = 'en-IN';
    utter.rate = 0.95;
    utter.pitch = 1;
    utter.volume = 0.85;
    const voices = window.speechSynthesis.getVoices();
    const en = pickEnglishIndiaVoice(voices);
    if (en) utter.voice = en;
    window.speechSynthesis.speak(utter);
    return true;
  } catch {
    return false;
  }
}

import {
  canSpeakFloorPrompt,
  speakFloorPrompt,
} from '@/features/partner-shop-floor/lib/floor-voice';

describe('floor voice gates', () => {
  it('blocks when setting off', () => {
    expect(
      canSpeakFloorPrompt({
        settingEnabled: false,
        prefersReducedMotion: false,
        soundOff: false,
      }),
    ).toBe(false);
  });

  it('blocks when reduced motion', () => {
    expect(
      canSpeakFloorPrompt({
        settingEnabled: true,
        prefersReducedMotion: true,
        soundOff: false,
      }),
    ).toBe(false);
  });

  it('blocks when sound off', () => {
    expect(
      canSpeakFloorPrompt({
        settingEnabled: true,
        prefersReducedMotion: false,
        soundOff: true,
      }),
    ).toBe(false);
  });

  it('allows when setting on and motion/sound ok', () => {
    const speak = jest.fn();
    class MockUtterance {
      text: string;
      rate = 1;
      pitch = 1;
      volume = 1;
      voice: SpeechSynthesisVoice | null = null;
      constructor(text: string) {
        this.text = text;
      }
    }
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      configurable: true,
      value: MockUtterance,
    });
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        speak,
        cancel: jest.fn(),
        getVoices: () => [],
      },
    });
    expect(
      canSpeakFloorPrompt({
        settingEnabled: true,
        prefersReducedMotion: false,
        soundOff: false,
      }),
    ).toBe(true);
    expect(
      speakFloorPrompt('Order save हो गई', {
        settingEnabled: true,
        prefersReducedMotion: false,
        soundOff: false,
      }),
    ).toBe(true);
    expect(speak).toHaveBeenCalled();
  });
});
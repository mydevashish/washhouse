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

  it('speaks English with en-IN preference (never Hindi)', () => {
    const speak = jest.fn();
    const enIn = { lang: 'en-IN', name: 'English India' } as SpeechSynthesisVoice;
    const hi = { lang: 'hi-IN', name: 'Hindi' } as SpeechSynthesisVoice;
    class MockUtterance {
      text: string;
      lang = '';
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
        getVoices: () => [hi, enIn],
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
      speakFloorPrompt('Order saved', {
        settingEnabled: true,
        prefersReducedMotion: false,
        soundOff: false,
      }),
    ).toBe(true);
    expect(speak).toHaveBeenCalled();
    const utter = speak.mock.calls[0]?.[0] as InstanceType<typeof MockUtterance>;
    expect(utter.lang).toBe('en-IN');
    expect(utter.voice).toBe(enIn);
  });
});

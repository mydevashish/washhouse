'use client';

type PricingPageAtmosphereProps = {
  steamEnabled: boolean;
  waveEnabled?: boolean;
  /** Extra mid-height fabric wave (hero). */
  midWave?: boolean;
  /** Lighter waves for dark CTA band. */
  ctaWave?: boolean;
};

/**
 * Lightweight steam rise + fabric-wave layers (CSS/SVG only).
 * Presentational — pair with `.pricing-page[data-steam]` / `[data-wave]`.
 * Category fabric depth for the price guide lives on each rack ambient, not here.
 */
export function PricingPageAtmosphere({
  steamEnabled,
  waveEnabled = true,
  midWave = false,
  ctaWave = false,
}: PricingPageAtmosphereProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="pricing-atelier__grain" />
      {steamEnabled ? (
        <>
          <div className="pricing-page__steam pricing-page__steam--a" />
          <div className="pricing-page__steam pricing-page__steam--b" />
          <div className="pricing-page__steam pricing-page__steam--c" />
        </>
      ) : null}
      {waveEnabled ? (
        <>
          {midWave ? <div className="pricing-page__wave pricing-page__wave--mid" /> : null}
          <div
            className={
              ctaWave ? 'pricing-page__wave pricing-page__wave--cta' : 'pricing-page__wave'
            }
          />
        </>
      ) : null}
    </div>
  );
}

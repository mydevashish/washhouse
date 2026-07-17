'use client';

type PricingAtelierAtmosphereProps = {
  mistEnabled: boolean;
};

/** Decorative steam haze + fabric grain behind the price guide (z-index 0).
 * Per-category ambient imagery lives on each rack (`PricingCategoryAmbient`). */
export function PricingAtelierAtmosphere({ mistEnabled }: PricingAtelierAtmosphereProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="pricing-atelier__grain" />
      {mistEnabled ? (
        <>
          <div className="pricing-atelier__mist pricing-atelier__mist--a" />
          <div className="pricing-atelier__mist pricing-atelier__mist--b" />
          <div className="pricing-atelier__mist pricing-atelier__mist--c" />
        </>
      ) : null}
    </div>
  );
}

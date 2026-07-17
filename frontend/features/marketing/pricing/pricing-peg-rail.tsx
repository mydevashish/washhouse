'use client';

/**
 * Commercial laundry conveyor rod: continuous metal bar with collar rings
 * and tiny screw-head accents. Decorative only (`aria-hidden` on parent use).
 */
export function PricingPegRail() {
  return (
    <div className="pricing-peg-rail" aria-hidden>
      <div className="pricing-peg-rail__rod">
        <span className="pricing-peg-rail__collar pricing-peg-rail__collar--start" />
        <span className="pricing-peg-rail__collar pricing-peg-rail__collar--end" />
        <span className="pricing-peg-rail__screws" />
      </div>
    </div>
  );
}

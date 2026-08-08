'use client';

import { InfoBanner } from '@/components/ui/info-banner';
import { usePartnerPracticeMode } from '@/features/partner-shop-floor/hooks/use-partner-practice-mode';

/** Amber strip while Practice mode is on — training sessions / usability checklist. */
export function PartnerPracticeModeBanner() {
  const { enabled, hydrated } = usePartnerPracticeMode();

  if (!hydrated || !enabled) return null;

  return (
    <div className="border-b border-warning/30 px-3 py-2 sm:px-4" data-testid="practice-mode-banner">
      <InfoBanner variant="warning" title="Practice mode" className="border-0 bg-transparent p-0">
        Training only — use seed/staging data, not live customers. Timed checklist:
        docs/qa/partner-shop-floor-usability.md
      </InfoBanner>
    </div>
  );
}

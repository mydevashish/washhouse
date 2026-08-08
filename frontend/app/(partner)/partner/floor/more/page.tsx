import { permanentRedirect } from 'next/navigation';

export const metadata = { title: 'Partner · Settings' };

/**
 * Legacy Shop Floor More → Settings (mode chrome retired).
 */
export default function PartnerFloorMoreRedirectPage() {
  permanentRedirect('/partner/settings');
}

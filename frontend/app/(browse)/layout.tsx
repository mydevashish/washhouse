import { OptionalAuthRefresh } from '@/components/auth/optional-auth-refresh';
import { PartnerBrowseRedirect } from '@/components/auth/partner-browse-redirect';
import { AppShell } from '@/components/layout/app-shell';

/** Discover is public — no login required to browse laundries. */
export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <OptionalAuthRefresh />
      <PartnerBrowseRedirect />
      {children}
    </AppShell>
  );
}

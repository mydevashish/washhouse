import { OptionalAuthRefresh } from '@/components/auth/optional-auth-refresh';
import { PartnerShell } from '@/components/layout/partner-shell';

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <PartnerShell>
      <OptionalAuthRefresh />
      {children}
    </PartnerShell>
  );
}

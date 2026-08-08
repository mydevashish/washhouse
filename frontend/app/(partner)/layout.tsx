import { Suspense } from 'react';

import { OptionalAuthRefresh } from '@/components/auth/optional-auth-refresh';
import { RoleGuard } from '@/components/auth/role-guard';
import { PartnerShell } from '@/components/layout/partner-shell';
import { PARTNER_PORTAL_ROLES } from '@/lib/partner-roles';

/** Gate partner chrome so customers/admins never see partner nav when denied. */
export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OptionalAuthRefresh />
      <RoleGuard roles={PARTNER_PORTAL_ROLES}>
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center bg-muted/20 text-sm text-muted-foreground">
              Loading partner…
            </div>
          }
        >
          <PartnerShell>{children}</PartnerShell>
        </Suspense>
      </RoleGuard>
    </>
  );
}

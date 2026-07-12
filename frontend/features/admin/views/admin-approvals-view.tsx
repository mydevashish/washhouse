'use client';

import { AdminApprovalQueue } from '@/features/admin/admin-approval-queue';
import { AdminCreateLaundry } from '@/features/admin/admin-create-laundry';
import { AdminContent } from '@/features/admin/components/admin-content';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { AdminPanel } from '@/features/admin/components/admin-panel';

const KYC_ITEMS = [
  { done: true, label: 'Business name & address' },
  { done: true, label: 'Owner contact verified' },
  { done: false, label: 'Document upload (coming soon)' },
  { done: false, label: 'Bank verification (coming soon)' },
];

export function AdminApprovalsView() {
  return (
    <AdminContent className="space-y-5">
      <AdminPageHeader title="Approvals" description="Review and onboard laundry partners." />

      <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
        <AdminPanel title="Pending queue" bodyClassName="p-3 sm:p-4">
          <AdminApprovalQueue />
        </AdminPanel>

        <AdminPanel title="KYC checklist" bodyClassName="px-4 py-3">
          <ul className="space-y-2 text-xs text-muted-foreground">
            {KYC_ITEMS.map((item) => (
              <li key={item.label} className="flex items-center gap-2">
                <span
                  className={
                    item.done ? 'text-success' : 'text-muted-foreground/50'
                  }
                  aria-hidden
                >
                  {item.done ? '✓' : '○'}
                </span>
                {item.label}
              </li>
            ))}
          </ul>
        </AdminPanel>
      </div>

      <AdminCreateLaundry />
    </AdminContent>
  );
}

import { AdminDashboardLazy } from '@/features/admin/admin-dashboard-lazy';

export const metadata = { title: 'Admin · Overview' };

/** Lazy client shell — keeps Recharts off the first admin paint (low-end Android). */
export default function AdminOverviewPage() {
  return <AdminDashboardLazy />;
}

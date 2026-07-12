import { DisputeCenterView } from '@/features/disputes/dispute-center-view';

export const metadata = { title: 'Dispute center' };

export default function DisputesPage() {
  return (
    <div className="min-h-screen bg-muted/30 px-4 py-6 pb-24 sm:px-6 sm:pb-6">
      <DisputeCenterView />
    </div>
  );
}

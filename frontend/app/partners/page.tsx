import { PublicShell } from '@/components/layout/public-shell';

export const metadata = { title: 'Become a partner' };

export default function PartnersPage() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-2xl px-4 py-10 sm:py-16">
        <h1 className="text-3xl font-semibold">Grow with DLM</h1>
        <p className="mt-4 text-fg-1">
          Partner with us to offer doorstep laundry in your city. Contact your platform admin to get
          onboarded, or sign in once your shop is approved.
        </p>
        <p className="text-fg-1">
          After approval, partners manage orders, inventory, and QR scans from the Partner panel.
        </p>
      </div>
    </PublicShell>
  );
}

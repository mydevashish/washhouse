import { Clock, Truck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { InfoBanner } from '@/components/ui/info-banner';
import { TrustBadges } from '@/features/discover/detail/trust-badges';
import type { LaundryDetail } from '@/services/laundries';

type LaundryOverviewTabProps = {
  laundry: LaundryDetail;
  startPrice: number;
  onSelectServices: () => void;
};

export function LaundryOverviewTab({
  laundry,
  startPrice,
  onSelectServices,
}: LaundryOverviewTabProps) {
  return (
    <div className="space-y-6">
      <InfoBanner title="How booking works">
        Choose your services on the <strong className="text-foreground">Services</strong> tab, then
        sign in to schedule free pickup. Prices shown are per item or per kg — no hidden fees.
      </InfoBanner>

      <Card className="rounded-2xl border-0 shadow-soft ring-1 ring-border/60">
        <CardContent className="p-6 sm:p-8">
          <h2 className="text-xl font-bold text-foreground">About this laundry</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            {laundry.description ??
              'A trusted local partner offering professional laundry care with doorstep pickup and delivery.'}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Services start from{' '}
            <span className="text-lg font-bold text-foreground">₹{startPrice}</span>
            <span className="font-medium">/kg</span>
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-soft ring-1 ring-border/60">
        <CardContent className="space-y-4 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-foreground">At a glance</h2>
          <DetailRow icon={Truck} label="Pickup & delivery" value="Free on all orders" />
          <DetailRow icon={Clock} label="Typical turnaround" value="24–48 hours" />
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-soft ring-1 ring-border/60">
        <CardContent className="p-6 sm:p-8">
          <h2 className="text-xl font-bold text-foreground">Why customers trust this store</h2>
          <div className="mt-4">
            <TrustBadges />
          </div>
        </CardContent>
      </Card>

      <Button type="button" size="lg" className="w-full sm:w-auto" onClick={onSelectServices}>
        View services &amp; prices
      </Button>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 text-sm">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
      <div>
        <p className="font-medium text-foreground">{label}</p>
        <p className="mt-0.5 text-muted-foreground">{value}</p>
      </div>
    </div>
  );
}

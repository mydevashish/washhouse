import { BadgeCheck, Clock, Shield, Sparkles, Truck } from 'lucide-react';

const BADGES = [
  { icon: BadgeCheck, label: 'Verified partner' },
  { icon: Truck, label: 'Free pickup' },
  { icon: Truck, label: 'Free delivery' },
  { icon: Clock, label: 'Same day options' },
  { icon: Sparkles, label: 'Professional cleaning' },
  { icon: Shield, label: 'Insured orders' },
] as const;

export function TrustBadges() {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {BADGES.map(({ icon: Icon, label }) => (
        <li key={label} className="flex items-center gap-2 text-sm text-fg-1">
          <Icon className="h-4 w-4 shrink-0 text-success" aria-hidden />
          {label}
        </li>
      ))}
    </ul>
  );
}

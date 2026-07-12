import {
  BedDouble,
  Droplets,
  Footprints,
  Flame,
  Shirt,
  Sparkles,
  Timer,
  type LucideIcon,
} from 'lucide-react';

import { deliveryLabel, serviceDeliveryHours } from '@/features/discover/lib/laundry-meta';
import type { LaundryServiceItem } from '@/services/laundries';

export function getServiceIcon(name: string, category: string): LucideIcon {
  const n = name.toLowerCase();
  if (n.includes('shoe')) return Footprints;
  if (n.includes('blanket') || n.includes('quilt') || n.includes('curtain')) return BedDouble;
  if (n.includes('dry')) return Shirt;
  if (n.includes('iron') || n.includes('press') || n.includes('steam')) return Flame;
  if (n.includes('express')) return Timer;
  if (n.includes('premium')) return Sparkles;
  if (category === 'wash' || n.includes('fold')) return Droplets;
  return Droplets;
}

export function formatUnitLabel(unit: string): string {
  switch (unit) {
    case 'kg':
      return 'per kilogram';
    case 'piece':
      return 'per item';
    case 'pair':
      return 'per pair';
    default:
      return `per ${unit}`;
  }
}

export function formatUnitPrice(price: string, unit: string): string {
  const suffix = unit === 'kg' ? '/kg' : unit === 'piece' ? '/item' : unit === 'pair' ? '/pair' : `/${unit}`;
  return `₹${price}${suffix}`;
}

export function getServiceMeta(service: LaundryServiceItem) {
  const hours = serviceDeliveryHours(service.category);
  return {
    icon: getServiceIcon(service.name, service.category),
    description: getServiceDescription(service),
    deliveryText: deliveryLabel(hours),
    unitLabel: formatUnitLabel(service.unit),
  };
}

export function getServiceDescription(service: LaundryServiceItem): string {
  const n = service.name.toLowerCase();
  if (n.includes('wash') && n.includes('fold')) {
    return 'Everyday clothes washed, dried, and neatly folded.';
  }
  if (n.includes('dry')) {
    return 'Premium care for suits, sarees, and delicate fabrics.';
  }
  if (n.includes('iron') || n.includes('press') || n.includes('steam')) {
    return 'Crisp, professional pressing for office and formal wear.';
  }
  if (n.includes('blanket') || n.includes('quilt')) {
    return 'Deep clean for bulky bedding and quilts.';
  }
  if (n.includes('shoe')) {
    return 'Restore and refresh your favourite footwear.';
  }
  switch (service.category) {
    case 'wash':
      return 'Regular wash, dry, and fold for everyday clothes.';
    case 'dry_clean':
      return 'Premium garment care with expert handling.';
    case 'iron':
      return 'Professional ironing for a polished look.';
    case 'special':
      return 'Specialist cleaning for unique items.';
    default:
      return 'Quality service from this trusted partner.';
  }
}

export function getLaundryInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

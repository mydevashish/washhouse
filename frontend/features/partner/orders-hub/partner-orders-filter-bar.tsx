'use client';

import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  PARTNER_ORDER_PAYMENT_FILTERS,
  PARTNER_ORDER_SOURCE_FILTERS,
  PARTNER_ORDER_STATUS_FILTERS,
} from '@/features/partner/orders-hub/partner-orders-hub-queue';

type PartnerOrdersFilterBarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  source: string;
  onSourceChange: (value: string) => void;
  payment: string;
  onPaymentChange: (value: string) => void;
};

export function PartnerOrdersFilterBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  source,
  onSourceChange,
  payment,
  onPaymentChange,
}: PartnerOrdersFilterBarProps) {
  return (
    <div
      className="flex flex-col gap-2 sm:flex-row sm:items-center"
      data-testid="partner-orders-filter-bar"
    >
      <Input
        type="search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Phone, name, tracking, token…"
        aria-label="Search orders by phone, name, tracking, or token"
        className="h-9 w-full sm:min-w-[12rem] sm:flex-1 sm:max-w-md"
        data-testid="partner-orders-search"
      />
      <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center">
        <label className="sr-only" htmlFor="partner-orders-filter-status">
          Status
        </label>
        <Select
          id="partner-orders-filter-status"
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="h-9 min-h-9 w-full py-1.5 text-sm sm:w-36"
          aria-label="Filter by status"
          data-testid="partner-orders-filter-status"
        >
          {PARTNER_ORDER_STATUS_FILTERS.map((opt) => (
            <option key={opt.value || 'any-status'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>

        <label className="sr-only" htmlFor="partner-orders-filter-source">
          Source
        </label>
        <Select
          id="partner-orders-filter-source"
          value={source}
          onChange={(e) => onSourceChange(e.target.value)}
          className="h-9 min-h-9 w-full py-1.5 text-sm sm:w-[8.75rem]"
          aria-label="Filter by source"
          data-testid="partner-orders-filter-source"
        >
          {PARTNER_ORDER_SOURCE_FILTERS.map((opt) => (
            <option key={opt.value || 'any-source'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>

        <label className="sr-only" htmlFor="partner-orders-filter-payment">
          Payment
        </label>
        <Select
          id="partner-orders-filter-payment"
          value={payment}
          onChange={(e) => onPaymentChange(e.target.value)}
          className="h-9 min-h-9 w-full py-1.5 text-sm sm:w-[8.75rem]"
          aria-label="Filter by payment"
          data-testid="partner-orders-filter-payment"
        >
          {PARTNER_ORDER_PAYMENT_FILTERS.map((opt) => (
            <option key={opt.value || 'any-payment'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { Headset, ListOrdered, MessageCircle, Phone, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { QueryErrorState } from '@/components/feedback/query-error-state';
import { Button } from '@/components/ui/button';
import { ClientDate } from '@/components/ui/client-date';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';
import { usePartnerHubCreateOrder } from '@/features/partner/orders-hub/workspace/partner-hub-create-order';
import { PartnerHubCustomersCreateDialog } from '@/features/partner/orders-hub/workspace/partner-hub-customers-create-dialog';
import { partnerHubCustomersListSearch } from '@/features/partner/orders-hub/workspace/partner-hub-customers-search';
import {
  PartnerHubWorkspacePagination,
  partnerHubPaginationFromList,
} from '@/features/partner/orders-hub/workspace/partner-hub-workspace-pagination';
import {
  customerSoftTag,
  customerScopedOrdersHref,
  deskPrefillHref,
  telHref,
  whatsappHref,
} from '@/features/partner/lib/owner-customer-crm';
import { rememberRecentCustomer } from '@/features/partner/lib/partner-recent-customers';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { useServerList } from '@/lib/pagination/use-server-list';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/lib/utils';
import {
  listPartnerCustomerInsights,
  type CustomerInsightRow,
} from '@/services/customer-insights';

function CustomerRowActions({ customer }: { customer: CustomerInsightRow }) {
  const { openCreateOrder } = usePartnerHubCreateOrder();
  const call = telHref(customer.phone);
  const wa = whatsappHref(customer.phone);
  const deskHref = deskPrefillHref(customer);
  const ordersHref = customerScopedOrdersHref(customer);

  function remember() {
    if (customer.phone) {
      rememberRecentCustomer({ phone: customer.phone, name: customer.name });
    }
  }

  function startOrder() {
    remember();
    openCreateOrder({
      phone: customer.phone ?? undefined,
      name: customer.name,
    });
  }

  return (
    <div className="flex flex-wrap justify-end gap-1" role="group" aria-label={`Actions for ${customer.name}`}>
      {call ? (
        <Button asChild variant="outline" size="sm" className="h-9 gap-1 px-2">
          <a href={call} aria-label={`Call ${customer.name}`}>
            <Phone className="h-3.5 w-3.5" aria-hidden />
            <span className="sr-only sm:not-sr-only">Call</span>
          </a>
        </Button>
      ) : null}
      {wa ? (
        <Button asChild variant="outline" size="sm" className="h-9 gap-1 px-2">
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`WhatsApp ${customer.name}`}
          >
            <MessageCircle className="h-3.5 w-3.5" aria-hidden />
            <span className="sr-only sm:not-sr-only">WA</span>
          </a>
        </Button>
      ) : null}
      <Button
        type="button"
        variant="default"
        size="sm"
        className="h-9 gap-1 px-2"
        onClick={startOrder}
        aria-label={`New order for ${customer.name}`}
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
        <span className="hidden sm:inline">Order</span>
      </Button>
      {ordersHref ? (
        <Button asChild variant="secondary" size="sm" className="h-9 gap-1 px-2">
          <Link
            href={ordersHref}
            onClick={remember}
            aria-label={`View orders for ${customer.name}`}
          >
            <ListOrdered className="h-3.5 w-3.5" aria-hidden />
            <span className="hidden sm:inline">Orders</span>
          </Link>
        </Button>
      ) : null}
      <Button asChild variant="secondary" size="sm" className="h-9 gap-1 px-2">
        <Link href={deskHref} onClick={remember} aria-label={`Open desk for ${customer.name}`}>
          <Headset className="h-3.5 w-3.5" aria-hidden />
          <span className="hidden sm:inline">Desk</span>
        </Link>
      </Button>
    </div>
  );
}

export function usePartnerHubCustomersList() {
  const enabled = usePartnerQueriesEnabled();
  return useServerList<CustomerInsightRow>({
    queryKey: queryKeys.partnerCustomerInsights('hub-workspace'),
    fetcher: (params) =>
      listPartnerCustomerInsights({
        page: params.page,
        page_size: 10,
        search: partnerHubCustomersListSearch(params.search ?? ''),
      }),
    defaultPageSize: 10,
    enabled,
  });
}

export function PartnerHubCustomersWorkspaceToolbar({
  searchInput,
  onSearchChange,
  onAddCustomer,
}: {
  searchInput: string;
  onSearchChange: (value: string) => void;
  onAddCustomer: () => void;
}) {
  return (
    <>
      <div className="relative min-w-0 flex-1 sm:max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search name or mobile…"
          className="h-9 pl-9"
          aria-label="Search customers"
          data-testid="hub-customers-search"
        />
      </div>
      <Button type="button" className="h-9 shrink-0" onClick={onAddCustomer} data-testid="hub-customers-add">
        Add customer
      </Button>
    </>
  );
}

export function PartnerHubCustomersWorkspaceBody({
  list,
  onAddCustomer,
}: {
  list: ReturnType<typeof usePartnerHubCustomersList>;
  onAddCustomer: () => void;
}) {
  const searchHint = useMemo(() => {
    const raw = list.search.trim();
    if (!raw) return null;
    if (raw.length < 2 && raw.replace(/\D/g, '').length < 4) {
      return 'Type at least 2 characters (or 4+ digits for phone).';
    }
    return null;
  }, [list.search]);

  if (list.isPending) {
    return (
      <div className="space-y-2" data-testid="hub-customers-loading">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (list.isError) {
    return (
      <QueryErrorState
        message={getApiErrorMessage(list.error, 'Could not load customers')}
        onRetry={() => list.refetch()}
      />
    );
  }

  if ((list.data?.items.length ?? 0) === 0) {
    return (
      <div
        className="rounded-xl border border-dashed border-border px-4 py-8 text-center"
        data-testid="hub-customers-empty"
      >
        <p className="text-sm font-medium text-foreground">No customers yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a customer or place a first order — they will appear here.
        </p>
        <Button type="button" className="mt-4 h-9" onClick={onAddCustomer}>
          Add customer
        </Button>
        {searchHint ? (
          <p className="mt-3 text-xs text-muted-foreground" role="status">
            {searchHint}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <div className="-mx-1 overflow-x-auto px-1">
        <Table containerClassName="min-w-[640px]" stickyHeader>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead>Last visit</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.data!.items.map((row) => {
              const tag = customerSoftTag(row.segment);
              return (
                <TableRow key={row.user_id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-muted-foreground">{row.phone ?? '—'}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.order_count}</TableCell>
                  <TableCell>
                    {row.last_order_at ? (
                      <ClientDate iso={row.last_order_at} mode="date" />
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-medium',
                        tag.className,
                      )}
                    >
                      {tag.label}
                    </span>
                  </TableCell>
                  <TableCell>
                    <CustomerRowActions customer={row} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {searchHint ? (
        <p className="text-xs text-muted-foreground" role="status">
          {searchHint}
        </p>
      ) : null}
    </>
  );
}

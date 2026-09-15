'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Search } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { createPartnerCustomer } from '@/features/partner/customer-desk/api';
import { updatePartnerCustomerByPhone } from '@/features/partner/customer-desk/api';
import type { CustomerDeskProfile, PartnerCustomerUpdateResult } from '@/features/partner/customer-desk/types';
import { usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';
import {
  formatPhoneInputDisplay,
  getPartnerPhoneFieldError,
  isPartnerPhoneReady,
  PARTNER_PHONE_INLINE_ERROR,
  partnerPhoneToE164,
} from '@/features/partner/lib/partner-phone-schema';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { queryKeys } from '@/lib/query-keys';
import { listPartnerCustomerInsights } from '@/services/customer-insights';
import { useServerList } from '@/lib/pagination/use-server-list';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { PartnerContent, PartnerPageHeader } from '../components/partner-content';

type CustomerRole = 'franchise' | 'admin';

type CustomerDirectoryRow = {
  id: string;
  name: string;
  number: string;
  address: string;
  state: string;
  pincode: string;
  spend: number;
  planName: string;
  planAmount: number;
  walletUsed: number;
  walletRemaining: number;
  franchiseName?: string;
};

const currentRole: CustomerRole = 'franchise';

function formatCurrency(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '₹0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(numeric);
}

export function PartnerCustomersView({ embedded = false }: { embedded?: boolean }) {
  const showFranchiseColumn = currentRole === 'admin';
  const queryClient = useQueryClient();
  const enabled = usePartnerQueriesEnabled();
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    title: 'Mr',
    name: '',
    phone: '',
    plan: 'No plan',
    addressLine1: '',
    addressLine2: '',
    city: '',
    pincode: '',
    state: '',
  });

  const customerList = useServerList({
    queryKey: ['partner-customer-insights'],
    fetcher: (params) => listPartnerCustomerInsights(params),
    defaultPageSize: 10,
    enabled,
  });

  const createCustomerMutation = useMutation<PartnerCustomerUpdateResult | CustomerDeskProfile, unknown, void>({
    mutationFn: () => {
      const name = customerForm.name.trim();
      const phone = partnerPhoneToE164(customerForm.phone);
      const payloadName = `${customerForm.title} ${name}`.trim();
      if (!name) throw new Error('Customer name is required');
      if (!isPartnerPhoneReady(customerForm.phone)) throw new Error(PARTNER_PHONE_INLINE_ERROR);
      if (!isPartnerPhoneReady(phone)) throw new Error(PARTNER_PHONE_INLINE_ERROR);
      if (isEditMode) {
        // Update existing customer by phone (supports address/plan/title now)
        return updatePartnerCustomerByPhone(phone, {
          name: payloadName,
          email: undefined,
          gender: undefined,
          notes: undefined,
          title: customerForm.title || undefined,
          plan: customerForm.plan as 'No plan' | 'Mini Plan' | 'Value Plan' | undefined,
          address_line_1: customerForm.addressLine1.trim() || undefined,
          address_line_2: customerForm.addressLine2.trim() || undefined,
          city: customerForm.city.trim() || undefined,
          state: customerForm.state.trim() || undefined,
          pincode: customerForm.pincode.trim() || undefined,
        });
      }

      return createPartnerCustomer({
        name: payloadName,
        phone,
        address_line_1: customerForm.addressLine1.trim() || undefined,
        address_line_2: customerForm.addressLine2.trim() || undefined,
        city: customerForm.city.trim() || undefined,
        state: customerForm.state.trim() || undefined,
        pincode: customerForm.pincode.trim() || undefined,
        plan: customerForm.plan as 'No plan' | 'Mini Plan' | 'Value Plan',
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['partner-customer-insights'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.partnerCustomerInsightsDashboard() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.partnerCustomers() });
      toast.success('Customer saved');
      setCustomerDialogOpen(false);
      setCustomerForm({
        title: 'Mr',
        name: '',
        phone: '',
        plan: 'No plan',
        addressLine1: '',
        addressLine2: '',
        city: '',
        pincode: '',
        state: '',
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Could not save customer'));
    },
  });

  function openAddCustomerDialog() {
    setIsEditMode(false);
    setCustomerForm({
      title: 'Mr',
      name: '',
      phone: '',
      plan: 'No plan',
      addressLine1: '',
      addressLine2: '',
      city: '',
      pincode: '',
      state: '',
    });
    setCustomerDialogOpen(true);
  }

  function openEditCustomerDialog(customer: CustomerDirectoryRow) {
    const formName = customer.name.replace(/^(Mr|Mrs|Ms)\s+/i, '').trim();
    setIsEditMode(true);
    setCustomerForm({
      title: customer.name.match(/^(Mr|Mrs|Ms)\b/i)?.[1] ?? 'Mr',
      name: formName,
      phone: customer.number,
      plan: customer.planName || 'No plan',
      addressLine1: customer.address,
      addressLine2: '',
      city: customer.state,
      pincode: customer.pincode,
      state: customer.state,
    });
    setCustomerDialogOpen(true);
  }

  function submitCustomerDialog() {
    createCustomerMutation.mutate();
  }

  const customerRows: CustomerDirectoryRow[] = (customerList.rows ?? []).map((customer, index) => {
    const extra = customer as Partial<{
      address_line_1?: string | null;
      address?: string | null;
      state?: string | null;
      pincode?: string | null;
      city?: string | null;
      plan_amount_inr?: string | number | null;
      wallet_used_inr?: string | number | null;
      wallet_remaining_inr?: string | number | null;
    }>;

    // Normalize multiple possible API field names and join address parts into one string
    const addr1 = (customer as any).address_line1 ?? (customer as any).address_line_1 ?? extra.address_line_1 ?? extra.address ?? '';
    const addr2 = (customer as any).address_line2 ?? (customer as any).address_line_2 ?? '';
    const city = (customer as any).city ?? extra.city ?? '';
    const state = (customer as any).state ?? extra.state ?? '';
    const pincode = (customer as any).pincode ?? extra.pincode ?? '';
    const fullAddress = [addr1, addr2, city, state, pincode].filter(Boolean).join(', ');

    const planName = (customer as any).plan_name ?? customer.segment_label ?? 'No plan';
    const planAmount = Number(extra.plan_amount_inr ?? (customer as any).plan_amount_inr ?? customer.avg_order_value_inr ?? 0);
    const walletUsed = Number(extra.wallet_used_inr ?? (customer as any).wallet_used_inr ?? customer.order_count ?? 0);
    const walletRemaining = Number(
      extra.wallet_remaining_inr ?? (customer as any).wallet_remaining_inr ?? (customer as any).wallet_balance_inr ?? customer.retention_score ?? 0,
    );

    return {
      id: customer.customer_id ?? customer.user_id ?? `customer-${index}`,
      name: customer.name,
      number: customer.phone ?? '',
      address: fullAddress,
      state,
      pincode,
      spend: Number(customer.lifetime_spend_inr ?? 0),
      planName,
      planAmount,
      walletUsed,
      walletRemaining,
      franchiseName: customer.segment_label,
    };
  });

  const customerPhoneError = getPartnerPhoneFieldError(customerForm.phone);
  const canSaveCustomer = Boolean(customerForm.name.trim()) && isPartnerPhoneReady(customerForm.phone);

  const body = (
    <PartnerContent className="space-y-4">
      <PartnerPageHeader
        title="Customers"
        description="Search by name or number and manage the day’s queue."
        actions={
          <Button
            type="button"
            size="sm"
            className="h-9 min-h-9"
            data-testid="partner-customers-page-new-customer"
            onClick={openAddCustomerDialog}
          >
            Add New Customer
          </Button>
        }
      />

      <div className="rounded-xl border border-border bg-background p-3 shadow-sm">
          <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or number…"
            className="h-10 pl-9"
            aria-label="Search customers"
              value={customerList.search}
              onChange={(event) => customerList.setSearch(event.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card" data-testid="owner-customer-grid">
        <Table className="min-w-[1200px]" aria-label="Customers list">
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">Name</TableHead>
              <TableHead className="text-center">Number</TableHead>
              <TableHead className="text-center">Address</TableHead>
              {/* <TableHead className="text-center">State</TableHead> */}
              {/* <TableHead className="text-center">Pincode</TableHead> */}
              <TableHead className="text-center">Overall Spend</TableHead>
              <TableHead className="text-center">Pending Amount</TableHead>
              <TableHead className="text-center">Plan / Wallet</TableHead>
              <TableHead className="text-center">Wallet Left</TableHead>
              {showFranchiseColumn ? <TableHead className="text-center">Franchise</TableHead> : null}
              <TableHead className="w-36 text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customerRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showFranchiseColumn ? 11 : 10} className="py-8 text-center text-muted-foreground">
                  No customers found.
                </TableCell>
              </TableRow>
            ) : (
              customerRows.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="text-center font-medium text-foreground">{customer.name}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{customer.number}</TableCell>
                  <TableCell className="text-center">{customer.address}</TableCell>
                  {/* <TableCell className="text-center">{customer.state}</TableCell> */}
                  {/* <TableCell className="text-center">{customer.pincode}</TableCell> */}
                  <TableCell className="text-center font-medium tabular-nums">
                    {formatCurrency(customer.spend)}
                  </TableCell>
                  <TableCell className="text-center font-medium tabular-nums">
                    {formatCurrency(customer.walletUsed)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-medium text-foreground">{customer.planName}</span>
                      {customer.planName !== 'No plan' ? (
                        <>
                          <span className="text-xs text-muted-foreground">Used {formatCurrency(customer.walletUsed)}</span>
                          <span className="text-xs text-muted-foreground">Wallet {formatCurrency(customer.planAmount)}</span>
                        </>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-medium tabular-nums text-amber-600">
                    {formatCurrency(customer.walletRemaining)}
                  </TableCell>
                  {showFranchiseColumn ? (
                    <TableCell className="text-center text-muted-foreground">{customer.franchiseName}</TableCell>
                  ) : null}
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 px-2.5 text-xs"
                        onClick={() => openEditCustomerDialog(customer)}
                        aria-label={`Edit ${customer.name}`}
                      >
                        <span className="flex items-center gap-1">
                          <Pencil className="h-3.5 w-3.5" aria-hidden />
                          Edit
                        </span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        page={customerList.page}
        pageCount={customerList.pageCount}
        pageSize={customerList.pageSize}
        pageStart={customerList.pageStart}
        pageEnd={customerList.pageEnd}
        totalCount={customerList.totalRecords}
        onPageChange={customerList.setPage}
        onPageSizeChange={customerList.setPageSize}
      />

      <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-w-[95vw] max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit customer' : 'Add new customer'}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Update the client details and save the changes.' : 'Fill the customer details and add them directly to this order.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="customer-dialog-title">Title</Label>
              <Select
                id="customer-dialog-title"
                value={customerForm.title}
                onChange={(e) => setCustomerForm((prev) => ({ ...prev, title: e.target.value }))}
                className="min-h-9"
              >
                <option value="Ms">Ms</option>
                <option value="Mrs">Mrs</option>
                <option value="Mr">Mr</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customer-dialog-name">Name</Label>
              <Input
                id="customer-dialog-name"
                value={customerForm.name}
                onChange={(e) => setCustomerForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Customer name"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="customer-dialog-phone">Mobile number</Label>
                  <Input
                    id="customer-dialog-phone"
                    type="tel"
                    inputMode="tel"
                    value={customerForm.phone}
                    onChange={(e) =>
                      setCustomerForm((prev) => ({
                        ...prev,
                        phone: formatPhoneInputDisplay(e.target.value),
                      }))
                    }
                    placeholder="e.g. 9876543210"
                    aria-invalid={Boolean(customerPhoneError)}
                    aria-describedby={customerPhoneError ? 'customer-dialog-phone-error' : undefined}
                  />
                  {customerPhoneError ? (
                    <p id="customer-dialog-phone-error" className="text-xs text-danger" role="alert">
                      {customerPhoneError}
                    </p>
                  ) : null}
                </div>
                <div>
                  <Label htmlFor="customer-dialog-plan">Plan</Label>
                  <Select
                    id="customer-dialog-plan"
                    value={customerForm.plan}
                    onChange={(e) => setCustomerForm((prev) => ({ ...prev, plan: e.target.value }))}
                    className="min-h-9"
                  >
                    <option value="No plan">No plan</option>
                    <option value="Mini Plan">Mini Plan — Pay ₹2,000 / Get ₹2,200</option>
                    <option value="Value Plan">Value Plan — Pay ₹5,000 / Get ₹5,500</option>
                  </Select>
                </div>
              </div>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="customer-dialog-address">Address line 1</Label>
              <Input
                id="customer-dialog-address"
                value={customerForm.addressLine1}
                onChange={(e) => setCustomerForm((prev) => ({ ...prev, addressLine1: e.target.value }))}
                placeholder="House / flat / building"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customer-dialog-address2">Address line 2</Label>
              <Input
                id="customer-dialog-address2"
                value={customerForm.addressLine2}
                onChange={(e) => setCustomerForm((prev) => ({ ...prev, addressLine2: e.target.value }))}
                placeholder="Area / landmark"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customer-dialog-city">City</Label>
              <Input
                id="customer-dialog-city"
                value={customerForm.city}
                onChange={(e) => setCustomerForm((prev) => ({ ...prev, city: e.target.value }))}
                placeholder="City"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customer-dialog-pincode">Pincode</Label>
              <Input
                id="customer-dialog-pincode"
                value={customerForm.pincode}
                onChange={(e) => setCustomerForm((prev) => ({ ...prev, pincode: e.target.value }))}
                placeholder="Pincode"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customer-dialog-state">State</Label>
              <Input
                id="customer-dialog-state"
                value={customerForm.state}
                onChange={(e) => setCustomerForm((prev) => ({ ...prev, state: e.target.value }))}
                placeholder="State"
              />
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => setCustomerDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={submitCustomerDialog}
              disabled={!canSaveCustomer || createCustomerMutation.isPending}
            >
              {createCustomerMutation.isPending ? 'Saving…' : isEditMode ? 'Save changes' : 'Add customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PartnerContent>
  );

  return embedded ? <div className="space-y-4">{body}</div> : <div className="space-y-4">{body}</div>;
}

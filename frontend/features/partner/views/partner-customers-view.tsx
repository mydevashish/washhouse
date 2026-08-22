'use client';

import { Pencil, Search } from 'lucide-react';
import { useState } from 'react';

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
import {
  formatPhoneInputDisplay,
  getPartnerPhoneFieldError,
  isPartnerPhoneReady,
  PARTNER_PHONE_INLINE_ERROR,
  partnerPhoneToE164,
} from '@/features/partner/lib/partner-phone-schema';
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

const dummyCustomers: CustomerDirectoryRow[] = [
  {
    id: 'cust-101',
    name: 'Priya Sharma',
    number: '+91 98765 43210',
    address: '12 Green Park Road',
    state: 'Delhi',
    pincode: '110016',
    spend: 12500,
    planName: 'Premium Care',
    planAmount: 2999,
    walletUsed: 1500,
    walletRemaining: 1499,
    franchiseName: 'WashHouse South',
  },
  {
    id: 'cust-102',
    name: 'Aman Verma',
    number: '+91 99887 66554',
    address: '4th Floor, Sector 15',
    state: 'Gurugram',
    pincode: '122001',
    spend: 8900,
    planName: 'Care Plus',
    planAmount: 2499,
    walletUsed: 1500,
    walletRemaining: 999,
    franchiseName: 'WashHouse Central',
  },
  {
    id: 'cust-103',
    name: 'Mehak Singh',
    number: '+91 98111 22334',
    address: 'Block B, Ashok Vihar',
    state: 'Delhi',
    pincode: '110052',
    spend: 16450,
    planName: 'Elite Laundry',
    planAmount: 3999,
    walletUsed: 1800,
    walletRemaining: 2199,
    franchiseName: 'WashHouse West',
  },
  {
    id: 'cust-104',
    name: 'Rohit Gupta',
    number: '+91 97333 77888',
    address: '22 Janpath Lane',
    state: 'Noida',
    pincode: '201301',
    spend: 7200,
    planName: 'Monthly Wash',
    planAmount: 1999,
    walletUsed: 1200,
    walletRemaining: 799,
    franchiseName: 'WashHouse East',
  },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function PartnerCustomersView({ embedded = false }: { embedded?: boolean }) {
  const showFranchiseColumn = currentRole === 'admin';
  const emptyCustomerForm = {
    title: 'Ms',
    name: '',
    phone: '',
    plan: 'No plan',
    addressLine1: '',
    addressLine2: '',
    city: '',
    pincode: '',
    state: '',
  };

  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [customerForm, setCustomerForm] = useState(emptyCustomerForm);

  function openAddCustomerDialog() {
    setIsEditMode(false);
    setCustomerForm(emptyCustomerForm);
    setCustomerDialogOpen(true);
  }

  function handleDeleteCustomer(customer: CustomerDirectoryRow) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${customer.name}?`
    );

    if (!confirmed) return;

    // TODO: Delete API call
    console.log('Delete customer:', customer.id);
  }

  function openEditCustomerDialog(customer: CustomerDirectoryRow) {
    const formName = customer.name.replace(/^(Mr|Mrs|Ms)\s+/i, '').trim();
    setIsEditMode(true);
    setCustomerForm({
      title: customer.name.match(/^(Mr|Mrs|Ms)\b/i)?.[1] ?? 'Ms',
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
    const phone = partnerPhoneToE164(customerForm.phone);
    const name = customerForm.name.trim();

    if (!name) {
      return;
    }
    if (!isPartnerPhoneReady(customerForm.phone)) {
      return;
    }

    if (!isPartnerPhoneReady(phone)) {
      return;
    }

    setCustomerDialogOpen(false);
  }

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
            defaultValue=""
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
              <TableHead className="text-center">State</TableHead>
              <TableHead className="text-center">Pincode</TableHead>
              <TableHead className="text-center">Overall Spend</TableHead>
              <TableHead className="text-center">Pending Amount</TableHead>
              <TableHead className="text-center">Plan / Wallet</TableHead>
              <TableHead className="text-center">Wallet Left</TableHead>
              {showFranchiseColumn ? <TableHead className="text-center">Franchise</TableHead> : null}
              <TableHead className="w-36 text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dummyCustomers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="text-center font-medium text-foreground">{customer.name}</TableCell>
                <TableCell className="text-center text-muted-foreground">{customer.number}</TableCell>
                <TableCell className="text-center">{customer.address}</TableCell>
                <TableCell className="text-center">{customer.state}</TableCell>
                <TableCell className="text-center">{customer.pincode}</TableCell>
                <TableCell className="text-center font-medium tabular-nums">
                  {formatCurrency(customer.spend)}
                </TableCell>
                <TableCell className="text-center font-medium tabular-nums">
                  {formatCurrency(customer.spend)}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center">
                    <span className="font-medium text-foreground">{customer.planName}</span>
                    <span className="text-xs text-muted-foreground">
                      Used {formatCurrency(customer.walletUsed)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Wallet {formatCurrency(customer.planAmount)}
                    </span>
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
            ))}
          </TableBody>
        </Table>
      </div>

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
                    <option value="Basic Care">Basic Care</option>
                    <option value="Premium Care">Premium Care</option>
                    <option value="Family Plan">Family Plan</option>
                    <option value="Wallet Plan">Wallet Plan</option>
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
            <Button type="button" onClick={submitCustomerDialog} disabled={!canSaveCustomer}>
              {isEditMode ? 'Save changes' : 'Add customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PartnerContent>
  );

  return embedded ? <div className="space-y-4">{body}</div> : <div className="space-y-4">{body}</div>;
}

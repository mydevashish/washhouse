'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  Barcode,
  CalendarDays,
  ChartBar,
  FileText,
  PackagePlus,
  Percent,
  Printer,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  Sparkles,
  Truck,
  Users,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { AdminContent } from '@/features/admin/components/admin-content';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import {
  PartnerContent,
  PartnerPageHeader,
} from '@/features/partner/components/partner-content';
import { buildOrdersHubPath } from '@/lib/navigation/orders-hub';

const customer = {
  name: 'Rahul Sharma',
  status: 'Member',
  phone: '+91 98260 12345',
  address: '101, Shanti Nagar, Indore, MP - 452001',
  totalOrders: 24,
  totalSpent: 18540,
  loyaltyPoints: 120,
};

const serviceCatalog = [
  {
    id: 'wash-fold',
    title: 'Wash & Fold',
    subtitle: '₹80 / KG',
    description: 'Bulk laundry in KG',
    icon: ShoppingBag,
    rate: 80,
    unit: 'KG',
  },
  {
    id: 'wash-iron',
    title: 'Wash & Iron',
    subtitle: '₹120 / KG',
    description: 'KG pricing for wash and iron',
    icon: Shirt,
    rate: 120,
    unit: 'KG',
  },
  {
    id: 'dry-clean',
    title: 'Dry Cleaning',
    subtitle: 'Per item',
    description: 'Men, Women, Kids, Household, Winter',
    icon: PackagePlus,
    rate: 0,
    unit: 'Pc',
  },
  {
    id: 'steam-press',
    title: 'Steam Press',
    subtitle: '₹20 / Pc',
    description: 'Quick press service',
    icon: Sparkles,
    rate: 20,
    unit: 'Pc',
  },
  {
    id: 'shoe-clean',
    title: 'Shoe Cleaning',
    subtitle: '₹120 / Pair',
    description: 'Sole & shine',
    icon: ShieldCheck,
    rate: 120,
    unit: 'Pair',
  },
  {
    id: 'carpet-clean',
    title: 'Carpet Cleaning',
    subtitle: '₹35 / Sq.Ft',
    description: 'Carpet and rug deep clean',
    icon: Truck,
    rate: 35,
    unit: 'Sq.Ft',
  },
];

const initialOrderItems = [
  {
    id: 'wash-fold-1',
    name: 'Wash & Fold (KG)',
    type: 'Bulk Laundry',
    qty: 5.5,
    rate: 80,
  },
  {
    id: 'wash-iron-1',
    name: 'Wash & Iron (KG)',
    type: 'Bulk Laundry',
    qty: 3.5,
    rate: 120,
  },
  {
    id: 'dry-clean-shirt',
    name: 'Dry Cleaning (Shirt)',
    type: 'Men',
    qty: 2,
    rate: 80,
  },
  {
    id: 'dry-clean-suit',
    name: 'Dry Cleaning (Suit 2-Piece)',
    type: 'Men',
    qty: 1,
    rate: 350,
  },
  {
    id: 'steam-press-shirt',
    name: 'Steam Press (Shirt)',
    type: 'Shirt',
    qty: 3,
    rate: 20,
  },
];

type OrderItem = {
  id: string;
  name: string;
  type: string;
  qty: number;
  rate: number;
};

const drycleanCategories = {
  men: {
    label: 'Men',
    items: [
      { id: 'men-shirt', name: 'Shirt', rate: 80 },
      { id: 'men-tshirt', name: 'T-Shirt', rate: 70 },
      { id: 'men-pant', name: 'Pant', rate: 100 },
      { id: 'men-suit', name: 'Suit 2-Piece', rate: 350 },
      { id: 'men-blazer', name: 'Blazer', rate: 200 },
    ],
  },
  women: {
    label: 'Women',
    items: [
      { id: 'women-saree', name: 'Saree', rate: 250 },
      { id: 'women-dress', name: 'Dress', rate: 180 },
      { id: 'women-top', name: 'Top', rate: 90 },
      { id: 'women-skirt', name: 'Skirt', rate: 120 },
    ],
  },
  kids: {
    label: 'Kids',
    items: [
      { id: 'kids-shirt', name: 'Shirt', rate: 60 },
      { id: 'kids-tshirt', name: 'T-Shirt', rate: 50 },
      { id: 'kids-jeans', name: 'Jeans', rate: 80 },
      { id: 'kids-frock', name: 'Frock', rate: 70 },
    ],
  },
  household: {
    label: 'Household',
    items: [
      { id: 'house-bedsheet', name: 'Bedsheet', rate: 120 },
      { id: 'house-curtain', name: 'Curtain', rate: 140 },
      { id: 'house-blanket', name: 'Blanket', rate: 200 },
      { id: 'house-pillow', name: 'Pillow cover', rate: 40 },
    ],
  },
  winter: {
    label: 'Winter',
    items: [
      { id: 'winter-jacket', name: 'Jacket', rate: 220 },
      { id: 'winter-sweater', name: 'Sweater', rate: 160 },
      { id: 'winter-coat', name: 'Coat', rate: 280 },
      { id: 'winter-shawl', name: 'Shawl', rate: 130 },
    ],
  },
} as const;

export type WashhouseOrderDemoVariant = 'admin' | 'partner';

export function AdminOrderDemoView({
  variant = 'admin',
}: { variant?: WashhouseOrderDemoVariant } = {}) {
  const isPartner = variant === 'partner';
  const [query, setQuery] = useState('Rahul Sharma');
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>(initialOrderItems);
  const [couponCode, setCouponCode] = useState('WELCOME10');
  const [couponApplied, setCouponApplied] = useState(true);
  const [deliveryType, setDeliveryType] = useState<'Pickup' | 'Delivery' | 'Both'>('Both');
  const [deliveryDate, setDeliveryDate] = useState('2025-07-24');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('Please pack separately for family members.');
  const [orderCreated, setOrderCreated] = useState(false);
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [activeDialogService, setActiveDialogService] = useState<string | null>(null);
  const [serviceQuantity, setServiceQuantity] = useState('1');
  const [drycleanCategory, setDrycleanCategory] = useState<keyof typeof drycleanCategories>('men');
  const [drycleanItems, setDrycleanItems] = useState<Record<string, number>>({});

  const lineRows = useMemo(
    () =>
      selectedItems.map((item) => ({
        ...item,
        amount: Number((item.qty * item.rate).toFixed(2)),
      })),
    [selectedItems],
  );

  type DrycleanPreviewItem = {
    key: string;
    label: string;
    qty: number;
    rate: number;
    amount: number;
  };

  const drycleanSelectedItems = useMemo(() => {
    const items = Object.entries(drycleanItems)
      .filter(([, qty]) => qty > 0)
      .map(([key, qty]) => {
        const category = Object.values(drycleanCategories).find((cat) =>
          cat.items.some((item) => item.id === key),
        );
        const item = category?.items.find((item) => item.id === key);
        if (!item || !category) return null;
        const rate = item.rate as number;
        return {
          key,
          label: `${category.label} ${item.name}`,
          qty,
          rate,
          amount: qty * rate,
        };
      }) as Array<DrycleanPreviewItem | null>;

    return items.filter((item): item is DrycleanPreviewItem => item !== null);
  }, [drycleanItems]);

  const drycleanDialogAmount = drycleanSelectedItems.reduce((sum, item) => sum + item.amount, 0);
  const drycleanDialogCount = drycleanSelectedItems.reduce((sum, item) => sum + item.qty, 0);

  const subtotal = useMemo(
    () => lineRows.reduce((sum, item) => sum + item.amount, 0),
    [lineRows],
  );

  const discount = couponApplied ? 100 : 0;
  const packingCharge = 10;
  const pickupCharge = deliveryType === 'Delivery' ? 0 : 30;
  const deliveryCharge = deliveryType === 'Pickup' ? 0 : 30;
  // const cgst = Math.round(((subtotal - discount + pickupCharge + deliveryCharge + packingCharge) * 0.025) * 100) / 100;
  // const sgst = cgst;
  const grandTotal = subtotal - discount + pickupCharge + deliveryCharge + packingCharge; // + cgst + sgst;

  const itemCount = selectedItems.reduce((sum, item) => sum + item.qty, 0);
  const serviceCount = selectedItems.length;

  function updateQty(id: string, delta: number) {
    setSelectedItems((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? {
                ...item,
                qty: Math.max(0, Number((item.qty + delta).toFixed(1))),
              }
            : item,
        )
        .filter((item) => item.qty > 0),
    );
  }

  function openServiceDialog(serviceId: string) {
    setActiveDialogService(serviceId);
    setServiceQuantity('1');
    setDrycleanCategory('men');
  }

  function setDrycleanQty(itemId: string, qty: number) {
    setDrycleanItems((prev) => ({
      ...prev,
      [itemId]: Math.max(0, qty),
    }));
  }

  function addDialogService() {
    if (!activeDialogService) return;

    if (activeDialogService === 'dry-clean') {
      const itemsToAdd = Object.entries(drycleanItems)
        .filter(([, qty]) => qty > 0)
        .map(([key, qty]) => {
          const category = Object.values(drycleanCategories).find((cat) =>
            cat.items.some((item) => item.id === key),
          );
          const item = category?.items.find((item) => item.id === key);
          if (!item || !category) return null;
          return {
            id: `${key}`,
            name: `${category.label} ${item.name}`,
            type: `${category.label} Dry Clean`,
            qty,
            rate: item.rate,
          };
        })
        .filter(Boolean) as Array<{ id: string; name: string; type: string; qty: number; rate: number }>;

      if (itemsToAdd.length === 0) {
        return;
      }

      setSelectedItems((prev) => {
        const updated = [...prev];

        itemsToAdd.forEach((itemToAdd) => {
          const existingIndex = updated.findIndex((item) => item.name === itemToAdd.name && item.rate === itemToAdd.rate);
          if (existingIndex >= 0) {
            const existingItem = updated[existingIndex];
            if (!existingItem) return;

            updated[existingIndex] = {
              ...existingItem,
              qty: existingItem.qty + itemToAdd.qty,
            };
          } else {
            updated.push({ ...itemToAdd, id: `${itemToAdd.id}-${Date.now()}` });
          }
        });

        return updated;
      });

      setDrycleanItems({});
    } else {
      const service = serviceCatalog.find((item) => item.id === activeDialogService);
      if (!service) return;
      const qty = Number(serviceQuantity) || 0;
      if (qty <= 0) return;

      setSelectedItems((prev) => {
        const existingIndex = prev.findIndex(
          (item) => item.name === `${service.title} (${service.unit})` && item.rate === service.rate,
        );

        if (existingIndex >= 0) {
          return prev.map((item, index) =>
            index === existingIndex
              ? {
                  ...item,
                  qty: item.qty + qty,
                }
              : item,
          );
        }

        return [
          ...prev,
          {
            id: `${service.id}-${Date.now()}`,
            name: `${service.title} (${service.unit})`,
            type: service.description,
            qty,
            rate: service.rate,
          },
        ];
      });
    }

    setActiveDialogService(null);
  }

  const menuItems = [
    { label: 'Dashboard', icon: Users, href: '/admin' },
    { label: 'New Order', icon: PackagePlus, href: '/admin/order-demo' },
    { label: 'Orders', icon: Truck, href: '/admin/orders' },
    { label: 'Customers', icon: Users, href: '/admin/customers' },
    { label: 'Billing & Invoices', icon: FileText, href: '/admin' },
    { label: 'Tag / Label Printing', icon: Printer, href: '/admin' },
    { label: 'Services & Pricing', icon: Percent, href: '/admin' },
    { label: 'Reports', icon: ChartBar, href: '/admin' },
    { label: 'Settings', icon: ShieldCheck, href: '/admin/settings' },
  ];

  const Shell = isPartner ? PartnerContent : AdminContent;

  return (
    <Shell className="space-y-5">
      <div
        className={cn(
          isPartner ? 'space-y-5' : 'grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]',
        )}
      >
        {!isPartner ? (
        <aside className="hidden xl:block">
          <div className="sticky top-6 space-y-4 rounded-[32px] border border-border bg-background p-5 shadow-sm">
            <div className="space-y-3 rounded-[28px] bg-primary/5 p-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                W
              </div>
              <p className="text-sm font-semibold">WashHouse Admin</p>
              <p className="text-xs text-muted-foreground">Create orders, print tags and track delivery.</p>
            </div>
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeMenu === item.label;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setActiveMenu(item.label)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                      isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted/70'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="rounded-3xl bg-muted p-4">
              <p className="text-xs uppercase tracking-[.24em] text-muted-foreground">Live metrics</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Today</span>
                  <span className="font-semibold">28 orders</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Pickup</span>
                  <span className="font-semibold">12</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Delivery</span>
                  <span className="font-semibold">16</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
        ) : null}

        <div className="space-y-5">
          {isPartner ? (
            <PartnerPageHeader
              title="New Order / Laundry Dashboard"
              description="Search customer, add services, print tags, invoice preview, and delivery dispatch."
              actions={
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href="/partner/orders">Orders</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href={buildOrdersHubPath('/partner/orders', 'desk')}>Customers</Link>
                  </Button>
                </div>
              }
            />
          ) : (
          <AdminPageHeader
            title="New Order / Laundry Dashboard"
            description={`Section: ${activeMenu} · frontend demo with sidebar, photos, graphs and service add dialog.`}
            actions={
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href="/admin/orders">Orders</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/admin/customers">Customers</Link>
                </Button>
              </div>
            }
          />
          )}

          <section className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
            <div className="space-y-4 rounded-[32px] border border-border bg-background p-5 shadow-sm">
              <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="success">Live demo</Badge>
                    <p className="text-sm text-muted-foreground">Search customer, add services, and print tags.</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[.24em] text-muted-foreground">Featured service</p>
                    <h2 className="text-2xl font-semibold">Create a new laundry order quickly</h2>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Add wash, iron and dry clean services with category selection and quantity entry.
                    </p>
                  </div>
                </div>
                <div className="relative overflow-hidden rounded-3xl bg-muted/30">
                  <Image
                    src="/marketing/heroes/services.webp"
                    alt="Laundry services photo"
                    width={640}
                    height={420}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Total Orders", value: "28" },
                  { label: "Today's Sales", value: "₹12,540" },
                  { label: "Pending Payments", value: "₹3,850" },
                  { label: "New Customers", value: "18" },
                ].map((summary) => (
                  <div key={summary.label} className="rounded-3xl bg-muted p-4">
                    <p className="text-xs uppercase tracking-[.24em] text-muted-foreground">{summary.label}</p>
                    <p className="mt-3 text-xl font-semibold">{summary.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle>Order status overview</CardTitle>
                  <CardDescription>Today’s order progress across pickup, processing and delivery.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    {[
                      { label: 'New', value: 12, color: 'bg-primary' },
                      { label: 'Processing', value: 16, color: 'bg-secondary' },
                      { label: 'Ready', value: 8, color: 'bg-success' },
                      { label: 'Delivered', value: 24, color: 'bg-slate-500' },
                    ].map((status) => (
                      <div key={status.label} className="space-y-2">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{status.label}</span>
                          <span className="font-semibold">{status.value}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted">
                          <div className={`${status.color} h-full rounded-full`} style={{ width: `${Math.min(status.value * 2.5, 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-3xl bg-muted/40 p-4">
                    <p className="text-sm font-semibold">Sales trend</p>
                    <div className="mt-4 grid gap-2">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                        <div key={day} className="flex items-center gap-3 text-sm">
                          <span className="w-10 text-muted-foreground">{day}</span>
                          <div className="h-3 flex-1 rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${50 + index * 5}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="overflow-hidden rounded-3xl border border-border bg-muted/30">
                <Image
                  src="/marketing/heroes/delivery.webp"
                  alt="Delivery photo"
                  width={640}
                  height={420}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.55fr_0.95fr]">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>New order / Create order</CardTitle>
                <CardDescription>Search customer and add services with popup entry.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 rounded-3xl border border-border bg-muted/40 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">Search Customer</p>
                      <p className="text-xs text-muted-foreground">Search by name, mobile or customer ID.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Rahul Sharma"
                        className="min-w-[220px]"
                      />
                      <Button size="sm" variant="outline">Search</Button>
                      <Button size="sm">+ New Customer</Button>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-3xl border border-border bg-background p-4">
                      <p className="text-sm font-semibold">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">{customer.status}</p>
                      <div className="mt-3 space-y-2 text-sm">
                        <p>{customer.phone}</p>
                        <p>{customer.address}</p>
                      </div>
                    </div>
                    <div className="rounded-3xl border border-border bg-background p-4">
                      <p className="text-sm font-semibold">Customer value</p>
                      <div className="mt-3 grid gap-2 text-sm">
                        <p>Total orders: {customer.totalOrders}</p>
                        <p>Total spent: ₹{customer.totalSpent}</p>
                        <p>Loyalty points: {customer.loyaltyPoints}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {serviceCatalog.map((service) => {
                    const Icon = service.icon;
                    return (
                      <div key={service.id} className="rounded-3xl border border-border bg-background p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{service.title}</p>
                            <p className="text-xs text-muted-foreground">{service.subtitle}</p>
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">{service.description}</p>
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => openServiceDialog(service.id)}>
                            + Add
                          </Button>
                          <span className="text-sm font-semibold">{service.rate ? `₹${service.rate}` : 'Item rates vary'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-3xl border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Service / Item</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lineRows.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.type}</TableCell>
                          <TableCell className="space-x-2">
                            <Button size="sm" variant="outline" onClick={() => updateQty(item.id, -1)}>-</Button>
                            <span>{item.qty}</span>
                            <Button size="sm" variant="outline" onClick={() => updateQty(item.id, 1)}>+</Button>
                          </TableCell>
                          <TableCell>₹{item.rate}</TableCell>
                          <TableCell>₹{item.amount}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost" onClick={() => updateQty(item.id, -item.qty)}>
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle>Order summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 rounded-3xl bg-muted/40 p-4">
                    <div className="grid gap-4">
                      <div>
                        <Label htmlFor="coupon">Coupon discount</Label>
                        <div className="mt-2 flex gap-2">
                          <Input
                            id="coupon"
                            value={couponCode}
                            onChange={(event) => setCouponCode(event.target.value)}
                          />
                          <Button
                            size="sm"
                            variant={couponApplied ? 'success' : 'outline'}
                            onClick={() => setCouponApplied((current) => !current)}
                          >
                            {couponApplied ? 'Applied' : 'Apply'}
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="deliveryType">Pickup / Delivery</Label>
                        <div className="mt-2 grid gap-2 sm:grid-cols-3">
                          {(['Pickup', 'Delivery', 'Both'] as const).map((type) => (
                            <Button
                              key={type}
                              size="sm"
                              variant={deliveryType === type ? 'default' : 'outline'}
                              onClick={() => setDeliveryType(type)}
                            >
                              {type}
                            </Button>
                          ))}
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Pick-up charged when not Delivery only, delivery charged when not Pickup only.
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="deliveryDate">Preferred delivery date</Label>
                        <Input
                          id="deliveryDate"
                          type="date"
                          value={deliveryDate}
                          onChange={(event) => setDeliveryDate(event.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="paymentMethod">Payment method</Label>
                        <Select
                          id="paymentMethod"
                          value={paymentMethod}
                          onChange={(event) => setPaymentMethod(event.target.value)}
                        >
                          <option>Cash</option>
                          <option>UPI</option>
                          <option>Card</option>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="notes">Notes</Label>
                        <Input id="notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 rounded-3xl bg-muted/10 p-4">
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">{serviceCount} services</span>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">{itemCount} items</span>
                    </div>
                    {[
                      { label: 'Sub total', value: `₹${subtotal.toFixed(2)}` },
                      { label: 'Discount', value: `-₹${discount.toFixed(2)}` },
                      { label: 'Pickup charge', value: `₹${pickupCharge}` },
                      { label: 'Delivery charge', value: `₹${deliveryCharge}` },
                      { label: 'Packing charge', value: `₹${packingCharge}` },
                      // { label: 'SGST 2.5%', value: `₹${sgst.toFixed(2)}` },
                      // { label: 'CGST 2.5%', value: `₹${cgst.toFixed(2)}` },
                    ].map((row) => (
                      <div key={row.label} className="flex justify-between text-sm text-muted-foreground">
                        <span>{row.label}</span>
                        <span>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  <div className="flex items-center justify-between rounded-3xl bg-muted p-4 text-base font-semibold">
                    <span>Grand total</span>
                    <span>₹{grandTotal.toFixed(2)}</span>
                  </div>
                  <Button size="lg" onClick={() => setOrderCreated(true)}>
                    Create Order & Generate Tags
                  </Button>
                </CardFooter>
              </Card>

              <Card className="border-border">
                <CardHeader>
                  <CardTitle>Invoice & tags</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-3xl border border-border bg-background p-4">
                    <p className="text-xs uppercase tracking-[.24em] text-muted-foreground">Invoice NO</p>
                    <p className="mt-2 font-semibold">INV-WH-2507-00125</p>
                    <p className="mt-1 text-sm text-muted-foreground">Total ₹{grandTotal.toFixed(2)}</p>
                  </div>
                  <div className="grid gap-3">
                    <Button size="sm" variant="outline" onClick={() => window.print()}>
                      Download Invoice PDF
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => window.print()}>
                      Print Tag / Label
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-2">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Order details & status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-muted/40 p-4">
                    <p className="text-xs uppercase tracking-[.24em] text-muted-foreground">Customer details</p>
                    <p className="mt-2 font-semibold">{customer.name}</p>
                    <p className="text-sm">{customer.phone}</p>
                    <p className="text-sm">{customer.address}</p>
                  </div>
                  <div className="rounded-3xl bg-muted/40 p-4">
                    <p className="text-xs uppercase tracking-[.24em] text-muted-foreground">Order information</p>
                    <p className="mt-2 font-semibold">WH-2507-00125</p>
                    <p className="text-sm">24 Jul 2025, 10:30 AM</p>
                    <p className="text-sm">Status: Ready for delivery</p>
                  </div>
                </div>
                <div className="rounded-3xl border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Service Type</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lineRows.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.type}</TableCell>
                          <TableCell>{item.qty}</TableCell>
                          <TableCell>₹{item.rate}</TableCell>
                          <TableCell>₹{item.amount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle>Invoice</CardTitle>
                <CardDescription>GST invoice preview with bill summary.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-3xl bg-muted/40 p-4">
                  <div className="grid gap-1">
                    <p className="text-xs uppercase tracking-[.24em] text-muted-foreground">Invoice no.</p>
                    <p className="font-semibold">INV-WH-2507-00125</p>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                    <p>Order date: 24 Jul 2025</p>
                    <p>Payment method: {paymentMethod}</p>
                  </div>
                </div>
                <div className="rounded-3xl border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lineRows.slice(0, 4).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.qty}</TableCell>
                          <TableCell>₹{item.rate}</TableCell>
                          <TableCell>₹{item.amount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={3}>Grand Total</TableCell>
                        <TableCell>₹{grandTotal.toFixed(2)}</TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </CardContent>
              <CardFooter className="justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  Download PDF
                </Button>
                <Button size="sm" variant="secondary" onClick={() => window.print()}>
                  Print Invoice
                </Button>
              </CardFooter>
            </Card>
          </section>

          <section className="grid gap-5 xl:grid-cols-2">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Tag / Label printing</CardTitle>
                <CardDescription>Tag preview for bag and garment labels. No backend needed.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[30px] border border-border bg-background p-5 text-sm shadow-sm">
                    <p className="text-xs uppercase tracking-[.24em] text-muted-foreground">Bag tag</p>
                    <div className="mt-4 space-y-3">
                      <p className="font-semibold text-foreground">WH-2507-00125</p>
                      <p>{customer.name}</p>
                      <p className="text-sm text-muted-foreground">Wash & Iron + Dry Clean</p>
                      <p className="text-sm text-muted-foreground">24 Jul 2025 | Pickup</p>
                      <div className="h-24 rounded-2xl bg-muted/50 p-3">
                        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                          <span>Order code</span>
                          <span>3 items</span>
                        </div>
                        <div className="flex h-full items-end justify-center">
                          <Barcode className="h-16 w-16 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-[30px] border border-border bg-background p-5 text-sm shadow-sm">
                    <p className="text-xs uppercase tracking-[.24em] text-muted-foreground">Garment tag</p>
                    <div className="mt-4 space-y-3">
                      <p className="font-semibold text-foreground">Wash & Iron</p>
                      <p className="text-sm text-muted-foreground">Shirt • 3 pcs</p>
                      <p className="text-sm text-muted-foreground">Service: Wash & Fold</p>
                      <p className="text-sm text-muted-foreground">Customer: Rahul Sharma</p>
                      <div className="h-24 rounded-2xl bg-muted/50 p-3">
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                          <Barcode className="h-16 w-16" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  Print Tag
                </Button>
                <Button size="sm" variant="default" onClick={() => window.print()}>
                  Reprint Label
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle>Delivery dispatch</CardTitle>
                <CardDescription>Dummy delivery workflow and tracking details.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-3xl bg-muted/40 p-4">
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">Order</span>
                      <Badge>Ready</Badge>
                    </div>
                    <p className="text-sm">Pickup: 24 Jul 2025, 11:00 AM</p>
                    <p className="text-sm">Delivery: 25 Jul 2025, 05:00 PM</p>
                    <div className="grid gap-2 rounded-3xl bg-background p-4">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Delivery partner</span>
                        <span>Rahul Courier</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Vehicle</span>
                        <span>2-wheeler</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>OTP</span>
                        <span>487512</span>
                      </div>
                    </div>
                    <div className="rounded-3xl bg-muted p-4 text-sm">
                      <p className="font-semibold">Delivery note</p>
                      <p className="mt-2 text-muted-foreground">Keep the order sealed until pickup. Follow COVID-safe protocols.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {orderCreated && (
            <div className="rounded-3xl border border-primary/20 bg-primary/10 p-4 text-primary">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">Order created successfully</p>
                  <p className="text-sm text-primary/80">Dummy order WH-2507-00125 has been generated with tags and invoice preview.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setOrderCreated(false)}>
                    Create another order
                  </Button>
                  <Button size="sm" variant="success" onClick={() => window.print()}>
                    Print now
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={Boolean(activeDialogService)} onOpenChange={(open) => !open && setActiveDialogService(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {activeDialogService === 'dry-clean'
                ? 'Add Dry Cleaning items'
                : `Add ${serviceCatalog.find((item) => item.id === activeDialogService)?.title}`}
            </DialogTitle>
            <DialogDescription>
              {activeDialogService === 'dry-clean'
                ? 'Choose category and specify quantities for dry clean items.'
                : 'Enter quantity to add this service to the order.'}
            </DialogDescription>
          </DialogHeader>

          {activeDialogService && activeDialogService !== 'dry-clean' ? (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="serviceQty">Quantity ({serviceCatalog.find((item) => item.id === activeDialogService)?.unit})</Label>
                <Input
                  id="serviceQty"
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={serviceQuantity}
                  onChange={(event) => setServiceQuantity(event.target.value)}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Enter quantity in {serviceCatalog.find((item) => item.id === activeDialogService)?.unit}.
              </p>
            </div>
          ) : null}

          {activeDialogService === 'dry-clean' ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(drycleanCategories) as Array<keyof typeof drycleanCategories>).map((category) => (
                  <Button
                    key={category}
                    size="sm"
                    variant={drycleanCategory === category ? 'default' : 'outline'}
                    onClick={() => setDrycleanCategory(category)}
                  >
                    {drycleanCategories[category].label}
                  </Button>
                ))}
              </div>
              <div className="space-y-3 rounded-3xl border border-border bg-muted/40 p-4">
                {drycleanCategories[drycleanCategory].items.map((item) => (
                  <div key={item.id} className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-muted-foreground">₹{item.rate} / Pc</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDrycleanQty(item.id, (drycleanItems[item.id] ?? 0) - 1)}
                      >
                        -
                      </Button>
                      <span className="min-w-[2rem] text-center">{drycleanItems[item.id] ?? 0}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDrycleanQty(item.id, (drycleanItems[item.id] ?? 0) + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {drycleanSelectedItems.length > 0 ? (
                <div className="rounded-3xl bg-muted/20 p-4">
                  <p className="text-sm font-semibold">Dry clean preview</p>
                  <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <p>{drycleanDialogCount} items selected</p>
                    <p>Total amount: ₹{drycleanDialogAmount.toFixed(2)}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Select items to preview the dry clean total.</p>
              )}
            </div>
          ) : null}

          <DialogFooter>
            <Button onClick={addDialogService}>Add to order</Button>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}

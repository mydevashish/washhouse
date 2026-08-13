'use client';

import { useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Filter,
  PackageCheck,
  PackageOpen,
  Search,
  Shirt,
  Sparkles,
  Star,
  TrendingUp,
  Truck,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const formatCurrency = (value?: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const describeComparison = (current: number, previous: number) => {
  if (previous === 0) return { delta: 0, up: true };
  const diff = ((current - previous) / previous) * 100;
  return { delta: Math.abs(diff), up: diff >= 0 };
};

type DashboardCard = {
  kind: 'orders' | 'revenue';
  title: string;
  value: number;
  previous: number;
  currentLabel: string;
  previousLabel: string;
  accent: string;
  delta: number;
  up: boolean;
};

const summaryCards: DashboardCard[] = [
  {
    kind: 'orders',
    title: "Today's Orders",
    value: 10,
    previous: 20,
    currentLabel: 'Today',
    previousLabel: 'Yesterday',
    accent: 'bg-[#eef2ff] text-[#5865f2]',
    ...describeComparison(10, 20),
  },
  {
    kind: 'orders',
    title: 'This Week Orders',
    value: 150,
    previous: 100,
    currentLabel: 'This Week',
    previousLabel: 'Last Week',
    accent: 'bg-[#eef6ff] text-[#0ea5e9]',
    ...describeComparison(150, 100),
  },
  {
    kind: 'orders',
    title: 'This Month Orders',
    value: 1750,
    previous: 1000,
    currentLabel: 'This Month',
    previousLabel: 'Last Month',
    accent: 'bg-[#ecfdf5] text-[#10b981]',
    ...describeComparison(1750, 1000),
  },
];

const revenueCards: DashboardCard[] = [
  {
    kind: 'revenue',
    title: "Today's Revenue",
    value: 7500,
    previous: 15000,
    currentLabel: 'Today',
    previousLabel: 'Yesterday',
    accent: 'bg-gradient-to-br from-[#7c3aed] via-[#6366f1] to-[#4f46e5] text-white',
    ...describeComparison(7500, 15000),
  },
  {
    kind: 'revenue',
    title: 'This Week Revenue',
    value: 30000,
    previous: 20000,
    currentLabel: 'This Week',
    previousLabel: 'Last Week',
    accent: 'bg-gradient-to-br from-[#8b5cf6] via-[#6366f1] to-[#4f46e5] text-white',
    ...describeComparison(30000, 20000),
  },
  {
    kind: 'revenue',
    title: 'This Month Revenue',
    value: 100000,
    previous: 150000,
    currentLabel: 'This Month',
    previousLabel: 'Last Month',
    accent: 'bg-gradient-to-br from-[#7c3aed] via-[#5b4df7] to-[#4338ca] text-white',
    ...describeComparison(100000, 150000),
  },
];

const statusCards = [
  { label: 'In Process Orders', value: 60, tone: 'blue', icon: PackageCheck },
  { label: 'Ready for Delivery', value: 28, tone: 'green', icon: Check },
  { label: 'Completed Orders', value: 158, tone: 'teal', icon: Check },
];

const topServices = [
  { name: 'Wash & Fold', value: '235 Orders', pct: '36.6%', bar: 'w-[36.6%]' },
  { name: 'Wash & Iron', value: '165 Orders', pct: '25.7%', bar: 'w-[25.7%]' },
  { name: 'Dry Cleaning', value: '128 Orders', pct: '19.9%', bar: 'w-[19.9%]' },
  { name: 'Steam Iron', value: '78 Orders', pct: '12.1%', bar: 'w-[12.1%]' },
];

const recentOrders = [
  { id: '#ORD-1256', customer: 'Rahul Sharma', service: 'Wash & Fold', amount: '₹ 450', status: 'In Process' },
  { id: '#ORD-1255', customer: 'Priya Mehta', service: 'Dry Cleaning', amount: '₹ 650', status: 'Ready' },
  { id: '#ORD-1254', customer: 'Amit Verma', service: 'Wash & Iron', amount: '₹ 350', status: 'Out for Delivery' },
  { id: '#ORD-1253', customer: 'Neha Singh', service: 'Steam Iron', amount: '₹ 250', status: 'Completed' },
  { id: '#ORD-1252', customer: 'Vikram Patel', service: 'Wash & Fold', amount: '₹ 450', status: 'Pending' },
];

const customers = [
  { name: 'Rahul Sharma', orders: 18, spent: '₹ 8,450' },
  { name: 'Priya Mehta', orders: 15, spent: '₹ 6,780' },
  { name: 'Amit Verma', orders: 12, spent: '₹ 4,350' },
  { name: 'Neha Singh', orders: 10, spent: '₹ 3,250' },
  { name: 'Vikram Patel', orders: 9, spent: '₹ 3,100' },
];

const paymentSummary = [
  { label: 'Cash', value: '₹ 52,350', tone: 'bg-emerald-100 text-emerald-700' },
  { label: 'UPI', value: '₹ 61,820', tone: 'bg-purple-100 text-purple-700' },
  { label: 'Wallet', value: '₹ 5,930', tone: 'bg-yellow-100 text-yellow-700' },
  { label: 'Pending Payments', value: '₹ 4,850', tone: 'bg-rose-100 text-rose-700' },
];

const bottomStats = [
  { label: 'Total Customers', value: '1,256', delta: '+18.35%' },
  { label: 'New Customers', value: '85', delta: '+12.28%' },
  { label: 'Repeat Customers', value: '1,171', delta: '+20.15%' },
  { label: 'Average Order Value', value: '₹ 476', delta: '+6.29%' },
  { label: 'Avg. Delivery Time', value: '2.4 hrs', delta: '+4.00%' },
  { label: 'Customer Rating', value: '4.7 / 5', delta: '2,191' },
];

type RevenueChartPoint = {
  label: string;
  current: number;
  previous: number;
};

const revenuePeriods = ['Today', 'Week', 'Month', 'Year'] as const;

type RevenuePeriod = (typeof revenuePeriods)[number];

const revenueChartData: Record<RevenuePeriod, RevenueChartPoint[]> = {
  Today: [
    { label: '08:00', current: 100, previous: 50 },
    { label: '10:00', current: 200, previous: 300 },
    { label: '12:00', current: 400, previous: 300 },
    { label: '14:00', current: 400, previous: 200 },
    { label: '16:00', current: 300, previous: 300 },
    { label: '18:00', current: 300, previous: 800 },
  ],
  Week: [
    { label: 'Mon', current: 42000, previous: 36000 },
    { label: 'Tue', current: 46000, previous: 39000 },
    { label: 'Wed', current: 52000, previous: 44500 },
    { label: 'Thu', current: 57000, previous: 50000 },
    { label: 'Fri', current: 66000, previous: 56000 },
    { label: 'Sat', current: 72000, previous: 61000 },
    { label: 'Sun', current: 81000, previous: 70000 },
  ],
  Month: [
    { label: 'W1', current: 180000, previous: 165000 },
    { label: 'W2', current: 210000, previous: 190000 },
    { label: 'W3', current: 245000, previous: 220000 },
    { label: 'W4', current: 295000, previous: 265000 },
    { label: 'W5', current: 330000, previous: 290000 },
  ],
  Year: [
    { label: 'Jan', current: 260000, previous: 220000 },
    { label: 'Feb', current: 290000, previous: 240000 },
    { label: 'Mar', current: 325000, previous: 275000 },
    { label: 'Apr', current: 360000, previous: 300000 },
    { label: 'May', current: 398000, previous: 335000 },
    { label: 'Jun', current: 420000, previous: 352000 },
    { label: 'Jul', current: 450000, previous: 380000 },
    { label: 'Aug', current: 490000, previous: 410000 },
  ],
};

const revenueMetricOptions = ['Revenue'] as const;

type RevenueMetric = (typeof revenueMetricOptions)[number];

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'In Process': 'bg-blue-100 text-blue-700',
    Ready: 'bg-emerald-100 text-emerald-700',
    'Out for Delivery': 'bg-violet-100 text-violet-700',
    Completed: 'bg-emerald-100 text-emerald-700',
    Pending: 'bg-amber-100 text-amber-700',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-medium ${styles[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
}

export function PartnerLaundryDashboardView() {
  const [selectedPeriod, setSelectedPeriod] = useState<RevenuePeriod>('Week');
  const [selectedMetric, setSelectedMetric] = useState<RevenueMetric>('Revenue');

  const chartData: RevenueChartPoint[] = revenueChartData[selectedPeriod];

  const metricKey: keyof RevenueChartPoint = 'current';
  const prevMetricKey: keyof RevenueChartPoint = 'previous';
  const activeMetricColor = '#4f46e5';
  const previousPeriodColor = '#94a3b8';

  const currentTotal = chartData.reduce((sum, point) => sum + Number(point.current ?? 0), 0);
  const previousTotal = chartData.reduce((sum, point) => sum + Number(point.previous ?? 0), 0);
  const comparison = describeComparison(currentTotal, previousTotal);
  const periodLabel = selectedPeriod === 'Today'
    ? 'Yesterday'
    : selectedPeriod === 'Week'
      ? 'Last Week'
      : selectedPeriod === 'Month'
        ? 'Last Month'
        : 'Last Year';
  const comparisonLabel = `${comparison.up ? '+' : '-'}${comparison.delta.toFixed(1)}% vs ${periodLabel}`;
  const displayData = chartData;
  const totalStatusOrders = statusCards.reduce((sum, item) => sum + item.value, 0);
  const statusBreakdown = statusCards.map((item) => ({
    ...item,
    percentage: totalStatusOrders ? (item.value / totalStatusOrders) * 100 : 0,
  }));
  const statusColors: Record<string, string> = {
    orange: '#f59e0b',
    blue: '#3b82f6',
    green: '#10b981',
    purple: '#8b5cf6',
    teal: '#14b8a6',
    red: '#ef4444',
  };
  const donutGradient = statusBreakdown.reduce<{ acc: string; cumulative: number }>((result, item) => {
    const start = result.cumulative;
    const end = result.cumulative + item.percentage;
    const nextSegment = `${statusColors[item.tone]} ${start}% ${end}%`;
    return { acc: result.acc ? `${result.acc}, ${nextSegment}` : nextSegment, cumulative: end };
  }, { acc: '', cumulative: 0 }).acc;

  return (
    <div className="min-h-0 bg-[#f3f6fb] px-4 py-5 text-slate-800 lg:px-6">
      <div className="mx-auto max-w-[1500px] space-y-4">
        <header className="flex flex-col gap-4 rounded-[20px] bg-[#f3f6fb] px-2 py-1 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-[31px] font-semibold tracking-[-0.05em] text-slate-800">
              Welcome, Navratan Complex <span className="text-[22px]">👋</span>
            </h1>
            <p className="mt-1 text-sm text-slate-500">Here&apos;s what&apos;s happening at your franchise today.</p>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {[...summaryCards, ...revenueCards].map((card) => {
            const arrow = card.up ? ArrowUpRight : ArrowDownRight;
            const ArrowIcon = arrow;
            const deltaText = `${card.up ? '+' : '-'}${card.delta.toFixed(1)}%`;
            const badgeTone = card.up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600';
            const displayValue = card.kind === 'revenue' ? formatCurrency(card.value) : card.value.toLocaleString('en-IN');
            const previousValue = card.kind === 'revenue' ? formatCurrency(card.previous) : card.previous.toLocaleString('en-IN');

            return (
              <Card key={`${card.kind}-${card.title}`} className={`rounded-[20px] border border-slate-200 shadow-sm ${card.kind === 'revenue' ? 'bg-gradient-to-br from-[#f5f3ff] to-white' : 'bg-white'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[15px] text-slate-500">{card.title}</p>
                      <div className="mt-3 flex items-end gap-2">
                        <span className="text-[28px] font-semibold leading-none text-slate-800">{displayValue}</span>
                        <span className="mb-1 text-[12px] text-slate-400">{card.currentLabel}</span>
                      </div>
                    </div>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.accent}`}>
                      <ArrowIcon className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="text-[12px] text-slate-500">
                      <span className="font-medium text-slate-700">{previousValue}</span>
                      <span className="ml-1">{card.previousLabel}</span>
                    </div>
                    <div className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${badgeTone}`}>
                      <ArrowIcon className="h-3 w-3" />
                      {deltaText}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {statusCards.map((item) => {
            const Icon = item.icon;
            const toneMap: Record<string, string> = {
              orange: 'bg-orange-100 text-orange-600',
              blue: 'bg-blue-100 text-blue-600',
              green: 'bg-emerald-100 text-emerald-600',
              purple: 'bg-violet-100 text-violet-600',
              teal: 'bg-teal-100 text-teal-600',
              red: 'bg-red-100 text-red-600',
            };

            return (
              <Card key={item.label} className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
                <CardContent className="p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneMap[item.tone]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <button className="shrink-0 text-[10px] font-medium text-slate-500">View all</button>
                  </div>
                  <div className="mt-4 min-w-0">
                    <div className="text-[28px] font-semibold leading-none text-slate-800">{item.value}</div>
                    <div className="mt-2 line-clamp-2 text-[12px] leading-5 text-slate-500">{item.label}</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.55fr_1fr_1fr]">
          <Card className="rounded-[18px] border border-slate-200 bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="mb-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-500">Revenue Overview</p>
                    <h3 className="mt-1 text-[16px] font-semibold text-slate-800">Total Revenue</h3>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(['Today', 'Week', 'Month', 'Year'] as RevenuePeriod[]).map((period) => (
                    <button
                      key={period}
                      type="button"
                      onClick={() => setSelectedPeriod(period)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                        selectedPeriod === period
                          ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {revenueMetricOptions.map((metric) => (
                    <button
                      key={metric}
                      type="button"
                      onClick={() => setSelectedMetric(metric)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                        selectedMetric === metric
                          ? 'bg-slate-800 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {metric}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[28px] font-semibold text-slate-800">
                    {formatCurrency(currentTotal)}
                  </div>
                  <div className={`mt-1 flex items-center gap-2 text-xs ${comparison.up ? 'text-emerald-600' : 'text-red-600'}`}>
                    {comparison.up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                    {comparisonLabel}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-right">
                  <div className="text-[11px] uppercase tracking-[0.12em] text-slate-500">{periodLabel}</div>
                  <div className="mt-1 text-base font-semibold text-slate-700">{formatCurrency(previousTotal)}</div>
                </div>
              </div>

              <div className="mt-5 h-72 rounded-xl bg-gradient-to-b from-sky-50 to-white p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#dbeafe" strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={45} tickFormatter={(value) => {
                      if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`;
                      return `₹${value}`;
                    }} />
                    <Tooltip
                      formatter={(value, name) => {
                        const numericValue = Number(Array.isArray(value) ? value[0] : value ?? 0);
                        return [formatCurrency(numericValue), name === 'current' ? 'Current' : 'Previous'];
                      }}
                      labelFormatter={(label) => `${label}`}
                      contentStyle={{ borderRadius: '12px', borderColor: '#e2e8f0' }}
                    />
                    <Line
                      type="monotone"
                      dataKey={metricKey}
                      name="current"
                      stroke={activeMetricColor}
                      strokeWidth={3}
                      dot={{ r: 3, fill: activeMetricColor }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey={prevMetricKey}
                      name="previous"
                      stroke={previousPeriodColor}
                      strokeWidth={2.5}
                      strokeDasharray="6 6"
                      dot={{ r: 2.5, fill: previousPeriodColor }}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[18px] border border-slate-200 bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Orders by Status</p>
                  <h3 className="mt-1 text-[16px] font-semibold text-slate-800">Total {totalStatusOrders}</h3>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-500">
                  This Month
                </div>
              </div>

              <div className="flex items-center justify-center py-4">
                <div
                  className="relative flex h-40 w-40 items-center justify-center rounded-full"
                  style={{ background: `conic-gradient(${donutGradient})` }}
                >
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-center shadow-inner">
                    <div>
                      <div className="text-[20px] font-semibold text-slate-800">{totalStatusOrders}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                {statusBreakdown.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: statusColors[item.tone] }} />
                      {item.label.replace(' Orders', '').replace(' for Delivery', '')}
                    </span>
                    <span>
                      {item.value} ({item.percentage.toFixed(2)}%)
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[18px] border border-slate-200 bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Top Services</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-500">
                  This Month <ChevronDown className="ml-1 inline h-3 w-3" />
                </div>
              </div>

              <div className="space-y-4">
                {topServices.map((service) => (
                  <div key={service.name}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-700">
                        <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                        {service.name}
                      </div>
                      <span className="text-slate-500">{service.value}</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-100">
                      <div className={`h-2.5 rounded-full bg-blue-500 ${service.bar}`} />
                    </div>
                    <div className="mt-1 text-right text-[11px] text-slate-500">{service.pct}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.7fr_1.15fr_1.15fr]">
          <Card className="rounded-[18px] border border-slate-200 bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-800">Recent Orders</h3>
                <button className="text-sm font-medium text-blue-600">View all</button>
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-3 py-2.5 font-medium">Order ID</th>
                      <th className="px-3 py-2.5 font-medium">Customer</th>
                      <th className="px-3 py-2.5 font-medium">Service</th>
                      <th className="px-3 py-2.5 font-medium">Amount</th>
                      <th className="px-3 py-2.5 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {recentOrders.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/80">
                        <td className="px-3 py-2.5 font-medium text-slate-700">{row.id}</td>
                        <td className="px-3 py-2.5 text-slate-600">{row.customer}</td>
                        <td className="px-3 py-2.5 text-slate-600">{row.service}</td>
                        <td className="px-3 py-2.5 font-medium text-slate-700">{row.amount}</td>
                        <td className="px-3 py-2.5"><StatusPill status={row.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[18px] border border-slate-200 bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-800">Top Customers</h3>
                <button className="text-sm font-medium text-blue-600">View all</button>
              </div>
              <div className="space-y-3">
                {customers.map((customer, index) => (
                  <div key={customer.name} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                        {customer.name.slice(0, 1)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-700">{customer.name}</div>
                        <div className="text-xs text-slate-500">{customer.orders} orders</div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-slate-700">{customer.spent}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[18px] border border-slate-200 bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-800">Payment Summary</h3>
                <button className="text-sm font-medium text-blue-600">View all</button>
              </div>
              <div className="space-y-3">
                {paymentSummary.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${item.tone}`}>
                        {item.label === 'Cash' ? <Wallet className="h-3.5 w-3.5" /> : item.label === 'UPI' ? <Sparkles className="h-3.5 w-3.5" /> : item.label === 'Card' ? <TrendingUp className="h-3.5 w-3.5" /> : item.label === 'Wallet' ? <Users className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                      </div>
                      <span className="text-sm text-slate-600">{item.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {bottomStats.map((stat) => (
            <Card key={stat.label} className="rounded-[18px] border border-slate-200 bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-slate-500">{stat.label}</div>
                  <div className="rounded-xl bg-slate-100 p-2 text-slate-500">
                    {stat.label.includes('Customer') ? <Users className="h-4 w-4" /> : stat.label.includes('Order') ? <Shirt className="h-4 w-4" /> : stat.label.includes('Delivery') ? <Truck className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                  </div>
                </div>
                <div className="mt-4 text-[22px] font-semibold text-slate-800">{stat.value}</div>
                <div className="mt-2 text-xs text-emerald-600">{stat.delta}</div>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </div>
  );
}

function idxLabel(index: number) {
  if (index === 0) return 'Today';
  if (index === 1) return 'Yesterday';
  if (index === 2) return 'This Week';
  return 'This Month';
}

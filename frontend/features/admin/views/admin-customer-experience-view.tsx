'use client';

import { useQuery } from '@tanstack/react-query';
import { Eye, MessageCircle, Phone, HelpCircle } from 'lucide-react';

import { AdminContent } from '@/features/admin/components/admin-content';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { AdminPanel } from '@/features/admin/components/admin-panel';
import { KpiCard, KpiGrid } from '@/features/admin/components/kpi-card';
import { formatCount } from '@/features/admin/lib/format-admin';
import { api, type ApiEnvelope } from '@/lib/api';

interface AdminCxOverview {
  store_views: number;
  service_views: number;
  calls_generated: number;
  whatsapp_clicks: number;
  questions_asked: number;
  callback_requests: number;
  pending_questions: number;
  pending_storefronts: number;
}

async function getAdminCxOverview(): Promise<AdminCxOverview> {
  const { data } = await api.get<ApiEnvelope<AdminCxOverview>>('/admin/customer-experience/overview');
  return data.data;
}

export function AdminCustomerExperienceView() {
  const overviewQ = useQuery({
    queryKey: ['admin-customer-experience-overview'],
    queryFn: getAdminCxOverview,
    staleTime: 60_000,
  });

  const d = overviewQ.data;

  return (
    <AdminContent className="space-y-5">
      <AdminPageHeader
        title="Customer experience"
        description="Service categories, storefront approval, contact rules, Q&A moderation, and engagement analytics."
      />

      <KpiGrid className="lg:grid-cols-4">
        <KpiCard label="Store views" value={formatCount(d?.store_views ?? 0)} icon={Eye} loading={overviewQ.isLoading} />
        <KpiCard label="Calls" value={formatCount(d?.calls_generated ?? 0)} icon={Phone} loading={overviewQ.isLoading} />
        <KpiCard label="WhatsApp clicks" value={formatCount(d?.whatsapp_clicks ?? 0)} icon={MessageCircle} loading={overviewQ.isLoading} />
        <KpiCard label="Pending Q&A" value={formatCount(d?.pending_questions ?? 0)} icon={HelpCircle} loading={overviewQ.isLoading} />
      </KpiGrid>

      <AdminPanel title="Admin controls" description="Manage taxonomy and moderation via API or extend this panel.">
        <ul className="list-inside list-disc space-y-1 p-4 text-sm text-muted-foreground">
          <li>Service categories — GET/POST/PATCH /admin/customer-experience/categories</li>
          <li>Facility tags — GET/POST/PATCH /admin/customer-experience/facility-tags</li>
          <li>Storefront approval — GET /admin/customer-experience/storefronts/pending</li>
          <li>Question moderation — GET /admin/customer-experience/questions</li>
          <li>Contact requires registered customer (platform default: enabled)</li>
        </ul>
      </AdminPanel>
    </AdminContent>
  );
}

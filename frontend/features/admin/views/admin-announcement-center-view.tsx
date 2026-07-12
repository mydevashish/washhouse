'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, Calendar, Megaphone, Send, Eye, MousePointerClick, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClientDate } from '@/components/ui/client-date';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { AdminContent } from '@/features/admin/components/admin-content';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { AdminPanel } from '@/features/admin/components/admin-panel';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { listLaundriesManagement } from '@/services/admin';
import {
  archiveAnnouncement,
  createAnnouncement,
  listAdminAnnouncements,
  publishAnnouncement,
  scheduleAnnouncement,
  STATUS_LABELS,
  TARGET_LABELS,
  type AnnouncementRow,
  type AnnouncementStatus,
  type AnnouncementTarget,
} from '@/services/announcements';
import { cn } from '@/lib/utils';

const TARGETS: AnnouncementTarget[] = [
  'all_users',
  'customers',
  'partners',
  'specific_laundries',
  'specific_cities',
];

function statusClass(status: AnnouncementStatus) {
  switch (status) {
    case 'published':
      return 'bg-success/15 text-success';
    case 'scheduled':
      return 'bg-sky-500/15 text-sky-700 dark:text-sky-300';
    case 'archived':
      return 'bg-muted text-muted-foreground';
    default:
      return 'bg-warning/15 text-warning';
  }
}

export function AdminAnnouncementCenterView() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<AnnouncementStatus | ''>('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetType, setTargetType] = useState<AnnouncementTarget>('all_users');
  const [cities, setCities] = useState('');
  const [laundrySearch, setLaundrySearch] = useState('');
  const [selectedLaundryIds, setSelectedLaundryIds] = useState<string[]>([]);
  const [channelInApp, setChannelInApp] = useState(true);
  const [channelEmail, setChannelEmail] = useState(false);
  const [channelPush, setChannelPush] = useState(false);
  const [actionUrl, setActionUrl] = useState('');
  const [requiresAck, setRequiresAck] = useState(false);
  const [scheduleAt, setScheduleAt] = useState('');

  const listQ = useQuery({
    queryKey: queryKeys.adminAnnouncements(statusFilter),
    queryFn: () => listAdminAnnouncements({ status: statusFilter || undefined, limit: 50 }),
    staleTime: STALE.adminDashboard,
  });

  const laundriesQ = useQuery({
    queryKey: queryKeys.adminLaundriesManagement(),
    queryFn: listLaundriesManagement,
    enabled: targetType === 'specific_laundries',
    staleTime: 60_000,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
  };

  const createM = useMutation({
    mutationFn: () =>
      createAnnouncement({
        title: title.trim(),
        body: body.trim(),
        target_type: targetType,
        target_laundry_ids: targetType === 'specific_laundries' ? selectedLaundryIds : [],
        target_cities:
          targetType === 'specific_cities'
            ? cities.split(',').map((c) => c.trim()).filter(Boolean)
            : [],
        channel_in_app: channelInApp,
        channel_email: channelEmail,
        channel_push: channelPush,
        action_url: actionUrl.trim() || null,
        requires_acknowledgement: requiresAck,
        scheduled_at: scheduleAt ? new Date(scheduleAt).toISOString() : null,
      }),
    onSuccess: () => {
      toast.success(scheduleAt ? 'Announcement scheduled' : 'Draft saved');
      setTitle('');
      setBody('');
      setScheduleAt('');
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not create announcement')),
  });

  const publishM = useMutation({
    mutationFn: publishAnnouncement,
    onSuccess: () => { toast.success('Published'); invalidate(); },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Publish failed')),
  });

  const scheduleM = useMutation({
    mutationFn: ({ id, at }: { id: string; at: string }) => scheduleAnnouncement(id, at),
    onSuccess: () => { toast.success('Scheduled'); invalidate(); },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Schedule failed')),
  });

  const archiveM = useMutation({
    mutationFn: archiveAnnouncement,
    onSuccess: () => { toast.success('Archived'); invalidate(); },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Archive failed')),
  });

  const filteredLaundries = (laundriesQ.data ?? [])
    .filter((l) => {
      const q = laundrySearch.trim().toLowerCase();
      if (!q) return true;
      return l.name.toLowerCase().includes(q) || l.city.toLowerCase().includes(q);
    })
    .slice(0, 12);

  const items = listQ.data?.items ?? [];

  return (
    <AdminContent className="space-y-5">
      <AdminPageHeader
        title="Announcement Center"
        description="Send targeted announcements via in-app, email, and push. Schedule, draft, publish, and track engagement."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <AdminPanel title="Compose announcement" bodyClassName="space-y-3 px-4 py-4">
          <div className="grid gap-1.5">
            <Label htmlFor="ann-title">Title</Label>
            <Input id="ann-title" className="h-9" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ann-body">Message</Label>
            <Textarea id="ann-body" rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ann-target">Target audience</Label>
            <Select
              id="ann-target"
              value={targetType}
              onChange={(e) => setTargetType(e.target.value as AnnouncementTarget)}
              className="h-9"
            >
              {TARGETS.map((t) => (
                <option key={t} value={t}>{TARGET_LABELS[t]}</option>
              ))}
            </Select>
          </div>
          {targetType === 'specific_cities' && (
            <div className="grid gap-1.5">
              <Label htmlFor="ann-cities">Cities (comma-separated)</Label>
              <Input id="ann-cities" placeholder="Mumbai, Bengaluru" value={cities} onChange={(e) => setCities(e.target.value)} className="h-9" />
            </div>
          )}
          {targetType === 'specific_laundries' && (
            <div className="space-y-2 rounded-lg border border-dashed border-border/60 p-3">
              <Input placeholder="Search laundries…" value={laundrySearch} onChange={(e) => setLaundrySearch(e.target.value)} className="h-9" />
              <div className="max-h-28 space-y-1 overflow-y-auto text-xs">
                {filteredLaundries.map((l) => (
                  <label key={l.id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-muted/50">
                    <input
                      type="checkbox"
                      checked={selectedLaundryIds.includes(l.id)}
                      onChange={(e) =>
                        setSelectedLaundryIds((ids) =>
                          e.target.checked ? [...ids, l.id] : ids.filter((id) => id !== l.id),
                        )
                      }
                    />
                    {l.name} · {l.city}
                  </label>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">{selectedLaundryIds.length} selected</p>
            </div>
          )}
          <div className="grid gap-2 sm:grid-cols-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={channelInApp} onChange={(e) => setChannelInApp(e.target.checked)} />
              In-app
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={channelEmail} onChange={(e) => setChannelEmail(e.target.checked)} />
              Email
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={channelPush} onChange={(e) => setChannelPush(e.target.checked)} />
              Push
            </label>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ann-url">Action URL (optional)</Label>
            <Input id="ann-url" placeholder="https://…" value={actionUrl} onChange={(e) => setActionUrl(e.target.value)} className="h-9" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={requiresAck} onChange={(e) => setRequiresAck(e.target.checked)} />
            Require acknowledgement
          </label>
          <div className="grid gap-1.5">
            <Label htmlFor="ann-schedule">Schedule for (optional)</Label>
            <Input id="ann-schedule" type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} className="h-9" />
          </div>
          <Button
            size="sm"
            disabled={!title.trim() || !body.trim() || createM.isPending || (!channelInApp && !channelEmail && !channelPush)}
            onClick={() => createM.mutate()}
          >
            {scheduleAt ? 'Schedule announcement' : 'Save draft'}
          </Button>
        </AdminPanel>

        <AdminPanel
          title="Announcements"
          toolbar={
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as AnnouncementStatus | '')} className="h-8 w-36 text-xs">
              <option value="">All statuses</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          }
          bodyClassName="divide-y divide-border/50 p-0"
        >
          {listQ.isLoading && <Skeleton className="m-4 h-32 w-full" />}
          {listQ.isError && (
            <p className="px-4 py-6 text-sm text-destructive">{getApiErrorMessage(listQ.error, 'Could not load announcements')}</p>
          )}
          {!listQ.isLoading && items.length === 0 && (
            <p className="px-4 py-6 text-sm text-muted-foreground">No announcements yet.</p>
          )}
          {items.map((row) => (
            <AnnouncementRowItem
              key={row.id}
              row={row}
              onPublish={() => publishM.mutate(row.id)}
              onArchive={() => archiveM.mutate(row.id)}
              onSchedule={(at) => scheduleM.mutate({ id: row.id, at })}
              pending={publishM.isPending || archiveM.isPending || scheduleM.isPending}
            />
          ))}
        </AdminPanel>
      </div>
    </AdminContent>
  );
}

function AnnouncementRowItem({
  row,
  onPublish,
  onArchive,
  onSchedule,
  pending,
}: {
  row: AnnouncementRow;
  onPublish: () => void;
  onArchive: () => void;
  onSchedule: (at: string) => void;
  pending: boolean;
}) {
  const [scheduleLocal, setScheduleLocal] = useState('');

  return (
    <article className="space-y-2 px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Megaphone className="h-4 w-4 text-muted-foreground" aria-hidden />
            <p className="font-medium">{row.title}</p>
            <Badge className={cn('font-normal', statusClass(row.status))}>{STATUS_LABELS[row.status]}</Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {TARGET_LABELS[row.target_type]}
            {row.channel_in_app && ' · In-app'}
            {row.channel_email && ' · Email'}
            {row.channel_push && ' · Push'}
          </p>
        </div>
        <ClientDate iso={row.created_at} mode="datetime" className="text-[10px] text-muted-foreground" />
      </div>
      <p className="line-clamp-2 text-sm text-muted-foreground">{row.body}</p>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> {row.view_count} views</span>
        <span className="inline-flex items-center gap-1"><MousePointerClick className="h-3 w-3" /> {row.click_count} clicks</span>
        <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {row.acknowledgement_count} acks</span>
      </div>
      {row.scheduled_at && (
        <p className="text-xs text-muted-foreground">
          Scheduled: <ClientDate iso={row.scheduled_at} mode="datetime" />
        </p>
      )}
      {row.published_at && (
        <p className="text-xs text-muted-foreground">
          Published: <ClientDate iso={row.published_at} mode="datetime" />
        </p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {(row.status === 'draft' || row.status === 'scheduled') && (
          <Button size="sm" variant="default" className="h-8 gap-1" disabled={pending} onClick={onPublish}>
            <Send className="h-3.5 w-3.5" /> Publish now
          </Button>
        )}
        {row.status === 'draft' && (
          <>
            <Input type="datetime-local" className="h-8 w-44 text-xs" value={scheduleLocal} onChange={(e) => setScheduleLocal(e.target.value)} />
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1"
              disabled={!scheduleLocal || pending}
              onClick={() => onSchedule(new Date(scheduleLocal).toISOString())}
            >
              <Calendar className="h-3.5 w-3.5" /> Schedule
            </Button>
          </>
        )}
        {row.status !== 'archived' && (
          <Button size="sm" variant="ghost" className="h-8 gap-1 text-muted-foreground" disabled={pending} onClick={onArchive}>
            <Archive className="h-3.5 w-3.5" /> Archive
          </Button>
        )}
      </div>
    </article>
  );
}

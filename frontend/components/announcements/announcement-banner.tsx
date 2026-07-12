'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import {
  getActiveAnnouncements,
  recordAnnouncementEvent,
  type ActiveAnnouncement,
} from '@/services/announcements';
import { cn } from '@/lib/utils';

function AnnouncementBannerItem({ item, onDismiss }: { item: ActiveAnnouncement; onDismiss: () => void }) {
  const ackM = useMutation({
    mutationFn: () => recordAnnouncementEvent(item.id, 'acknowledge'),
    onSuccess: onDismiss,
  });

  useEffect(() => {
    if (!item.viewed) {
      void recordAnnouncementEvent(item.id, 'view');
    }
  }, [item.id, item.viewed]);

  const handleClick = () => {
    void recordAnnouncementEvent(item.id, 'click');
    if (item.action_url) {
      window.open(item.action_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col gap-2 border-b border-primary/20 bg-primary/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
      )}
      role="region"
      aria-label={`Announcement: ${item.title}`}
    >
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground">{item.title}</p>
        <p className="text-sm text-muted-foreground">{item.body}</p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {item.action_url && (
          <Button size="sm" variant="outline" onClick={handleClick}>
            Learn more
          </Button>
        )}
        {item.requires_acknowledgement ? (
          <Button size="sm" disabled={ackM.isPending} onClick={() => ackM.mutate()}>
            Acknowledge
          </Button>
        ) : (
          <button
            type="button"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Dismiss announcement"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function AnnouncementBannerStack() {
  const queryClient = useQueryClient();
  const q = useQuery({
    queryKey: queryKeys.activeAnnouncements(),
    queryFn: getActiveAnnouncements,
    staleTime: STALE.adminDashboard,
    refetchInterval: 120_000,
  });

  const items = q.data ?? [];
  if (items.length === 0) return null;

  const dismissLocal = (id: string) => {
    queryClient.setQueryData<ActiveAnnouncement[]>(queryKeys.activeAnnouncements(), (prev) =>
      (prev ?? []).filter((a) => a.id !== id),
    );
  };

  return (
    <div className="border-b border-border/60">
      {items.map((item) => (
        <AnnouncementBannerItem key={item.id} item={item} onDismiss={() => dismissLocal(item.id)} />
      ))}
    </div>
  );
}

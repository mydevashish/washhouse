'use client';

import { useCallback, useEffect, useRef } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { PartnerHubWorkspaceId } from '@/features/partner/orders-hub/workspace/partner-hub-workspace-types';
import { usePartnerHubWorkspaceUrl } from '@/features/partner/orders-hub/workspace/use-partner-hub-workspace-url';
import { cn } from '@/lib/utils';

export type PartnerHubWorkspaceModalProps = {
  /** When set, dialog is open and `data-testid="hub-workspace-{id}"` is applied. */
  workspace: PartnerHubWorkspaceId | null;
  title: React.ReactNode;
  description?: React.ReactNode;
  toolbar?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  /** When true (default), closing the dialog clears `?workspace=` via shallow replace. */
  syncUrl?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
};

export function PartnerHubWorkspaceModal({
  workspace,
  title,
  description,
  toolbar,
  children,
  footer,
  syncUrl = true,
  onOpenChange,
  className,
}: PartnerHubWorkspaceModalProps) {
  const { setWorkspace } = usePartnerHubWorkspaceUrl();
  const open = workspace != null;
  const lastTriggerRef = useRef<HTMLElement | null>(null);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        if (syncUrl) setWorkspace(null);
        onOpenChange?.(false);
        queueMicrotask(() => {
          lastTriggerRef.current?.focus();
        });
        return;
      }
      onOpenChange?.(true);
    },
    [onOpenChange, setWorkspace, syncUrl],
  );

  useEffect(() => {
    if (open && typeof document !== 'undefined') {
      lastTriggerRef.current = document.activeElement as HTMLElement | null;
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        role="dialog"
        aria-modal="true"
        data-testid={workspace ? `hub-workspace-${workspace}` : undefined}
        className={cn(
          'max-w-[90vw] w-full max-h-[90vh] h-full sm:h-auto flex flex-col gap-0 p-0',
          'h-[100dvh] max-h-[100dvh] max-w-full rounded-none sm:rounded-lg sm:max-h-[90vh] sm:max-w-[90vw]',
          'left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]',
          className,
        )}
      >
        <div className="sticky top-0 z-10 shrink-0 border-b border-border bg-background px-4 py-3 sm:px-5 sm:py-4">
          <DialogHeader className="gap-1 space-y-0 pr-8">
            <DialogTitle>{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>
          {toolbar ? <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">{toolbar}</div> : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-5">{children}</div>

        {footer ? <div className="shrink-0">{footer}</div> : null}
      </DialogContent>
    </Dialog>
  );
}

/** Opens modal when `?workspace=` matches `workspaceId`. */
export function PartnerHubWorkspaceModalGate({
  workspaceId,
  ...rest
}: Omit<PartnerHubWorkspaceModalProps, 'workspace'> & {
  workspaceId: PartnerHubWorkspaceId;
}) {
  const { workspace } = usePartnerHubWorkspaceUrl();
  const active = workspace === workspaceId ? workspaceId : null;
  return <PartnerHubWorkspaceModal workspace={active} {...rest} />;
}

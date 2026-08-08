'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ASSIGNABLE_STAFF_ROLES,
  staffRoleVisual,
  type StaffCapability,
} from '@/features/partner/lib/owner-staff';
import { cn } from '@/lib/utils';
import {
  DEFAULT_WORK_SCHEDULE,
  WEEKDAYS,
  type StaffMember,
  type StaffRole,
  type WorkSchedule,
} from '@/services/staff-management';

function ScheduleFields({
  schedule,
  onChange,
}: {
  schedule: WorkSchedule;
  onChange: (s: WorkSchedule) => void;
}) {
  const toggleDay = (day: string) => {
    const days = schedule.days.includes(day)
      ? schedule.days.filter((d) => d !== day)
      : [...schedule.days, day];
    onChange({ ...schedule, days });
  };
  return (
    <div className="space-y-2">
      <Label>Work schedule</Label>
      <div className="flex flex-wrap gap-1">
        {WEEKDAYS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => toggleDay(id)}
            className={cn(
              'min-h-[36px] rounded-md border px-2.5 py-1 text-[11px] font-medium',
              schedule.days.includes(id)
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          type="time"
          value={schedule.start_time}
          onChange={(e) => onChange({ ...schedule, start_time: e.target.value.slice(0, 5) })}
          aria-label="Shift start"
        />
        <Input
          type="time"
          value={schedule.end_time}
          onChange={(e) => onChange({ ...schedule, end_time: e.target.value.slice(0, 5) })}
          aria-label="Shift end"
        />
      </div>
    </div>
  );
}

function RolePicker({
  value,
  onChange,
  preferCapability,
}: {
  value: StaffRole;
  onChange: (r: StaffRole) => void;
  preferCapability?: StaffCapability | null;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">Role</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {ASSIGNABLE_STAFF_ROLES.map((role) => {
          const visual = staffRoleVisual(role);
          const preferred =
            preferCapability === 'pickup'
              ? role === 'pickup_agent' || role === 'manager'
              : preferCapability === 'delivery'
                ? role === 'delivery_agent' || role === 'manager'
                : false;
          return (
            <button
              key={role}
              type="button"
              onClick={() => onChange(role)}
              className={cn(
                'flex gap-2 rounded-xl border p-2.5 text-left transition-colors',
                value === role
                  ? 'border-primary bg-primary/10 ring-1 ring-primary/40'
                  : 'border-border/70 hover:bg-muted/40',
                preferred && value !== role && 'border-info/40',
              )}
            >
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                <Image src={visual.imageSrc} alt="" fill sizes="48px" className="object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">{visual.label}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{visual.blurb}</p>
              </div>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export type StaffFormValues = {
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  work_schedule: WorkSchedule;
};

export function OwnerStaffFormDialog({
  open,
  onOpenChange,
  mode,
  initial,
  preferCapability,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  initial?: StaffMember | null;
  preferCapability?: StaffCapability | null;
  pending?: boolean;
  onSubmit: (values: StaffFormValues) => void;
}) {
  const defaultRole: StaffRole =
    preferCapability === 'delivery'
      ? 'delivery_agent'
      : preferCapability === 'pickup'
        ? 'pickup_agent'
        : 'pickup_agent';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<StaffRole>(defaultRole);
  const [schedule, setSchedule] = useState<WorkSchedule>(DEFAULT_WORK_SCHEDULE);

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && initial) {
      setName(initial.name);
      setEmail(initial.email ?? '');
      setPhone(initial.phone ?? '');
      setRole(
        ASSIGNABLE_STAFF_ROLES.includes(initial.role as StaffRole)
          ? (initial.role as StaffRole)
          : 'pickup_agent',
      );
      setSchedule(initial.work_schedule ?? DEFAULT_WORK_SCHEDULE);
      return;
    }
    setName('');
    setEmail('');
    setPhone('');
    setRole(defaultRole);
    setSchedule(DEFAULT_WORK_SCHEDULE);
  }, [open, mode, initial, defaultRole]);

  const canSubmit =
    name.trim().length > 0 && (mode === 'edit' || email.trim().length > 0) && !pending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add helper' : 'Edit staff'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Create a login with a clear role — pickup, delivery, shop floor, or manager.'
              : 'Update name, phone, role, or schedule.'}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSubmit) return;
            onSubmit({
              name: name.trim(),
              email: email.trim(),
              phone: phone.trim(),
              role,
              work_schedule: schedule,
            });
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="owner-staff-name">Full name</Label>
              <Input
                id="owner-staff-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
            {mode === 'create' ? (
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="owner-staff-email">Email (login)</Label>
                <Input
                  id="owner-staff-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            ) : null}
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="owner-staff-phone">Phone</Label>
              <Input
                id="owner-staff-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                placeholder="Optional"
              />
            </div>
          </div>

          <RolePicker value={role} onChange={setRole} preferCapability={preferCapability} />
          <ScheduleFields schedule={schedule} onChange={setSchedule} />

          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {pending ? 'Saving…' : mode === 'create' ? 'Add staff' : 'Save changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  BOOK_NOW_PREFERRED_TIMES,
  BOOK_NOW_SERVICES,
  type BookNowPreferredTime,
  type BookNowServiceId,
} from '@/features/marketing/book-now/book-now-constants';
import { useSubmitContact } from '@/features/marketing/hooks/use-marketing';
import { getMarketingSubmitErrorMessage } from '@/features/marketing/lib/marketing-form-errors';
import { applyApiFieldErrors } from '@/lib/api-field-errors';
import { cn } from '@/lib/utils';

const serviceValues = BOOK_NOW_SERVICES.map((s) => s.value) as [
  BookNowServiceId,
  ...BookNowServiceId[],
];

const preferredTimeValues = BOOK_NOW_PREFERRED_TIMES.map((t) => t.value) as [
  BookNowPreferredTime,
  ...BookNowPreferredTime[],
];

const bookPickupSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  phone: z
    .string()
    .transform((value) => value.replace(/\s/g, ''))
    .pipe(
      z
        .string()
        .min(1, 'Phone is required')
        .regex(
          /^(\+91)?[6-9]\d{9}$|^\+?[1-9]\d{9,14}$/,
          'Enter a valid mobile number (e.g. +919876543210)',
        ),
    ),
  service: z.enum(serviceValues, { required_error: 'Pick a service' }),
  preferredTime: z.enum(preferredTimeValues, { required_error: 'Pick a preferred time' }),
  message: z
    .string()
    .trim()
    .max(1500, 'Message is too long (max 1500 characters)')
    .optional(),
});

export type BookPickupFormValues = z.infer<typeof bookPickupSchema>;

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
};

function FormField({ id, label, error, required, children, hint }: FieldProps) {
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required ? (
          <span className="text-danger" aria-hidden>
            {' '}
            *
          </span>
        ) : null}
        {required ? <span className="sr-only"> (required)</span> : null}
      </Label>
      {children}
      {hint ? (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function buildContactMessage(values: BookPickupFormValues): string {
  const serviceLabel =
    BOOK_NOW_SERVICES.find((s) => s.value === values.service)?.label ?? values.service;
  const timeLabel =
    BOOK_NOW_PREFERRED_TIMES.find((t) => t.value === values.preferredTime)?.label ??
    values.preferredTime;
  const notes = values.message?.trim();

  const lines = [
    'Book pickup request (marketing)',
    `Service: ${serviceLabel}`,
    `Preferred time: ${timeLabel}`,
  ];
  if (notes) {
    lines.push(`Notes: ${notes}`);
  }
  return lines.join('\n');
}

type BookPickupFormProps = {
  defaultService?: BookNowServiceId;
  onSuccess?: () => void;
  idPrefix?: string;
};

/**
 * Lightweight book-pickup lead form — POSTs to POST /marketing/contact
 * with subject `order-help` (reuses existing marketing contact schema).
 */
export function BookPickupForm({
  defaultService,
  onSuccess,
  idPrefix = 'book',
}: BookPickupFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submitContact = useSubmitContact();
  const resolvedService = defaultService ?? BOOK_NOW_SERVICES[0]?.value ?? 'wash-fold';

  const form = useForm<BookPickupFormValues>({
    resolver: zodResolver(bookPickupSchema),
    defaultValues: {
      name: '',
      phone: '',
      service: resolvedService,
      preferredTime: 'flexible',
      message: '',
    },
    mode: 'onBlur',
  });

  const { errors, isSubmitting } = form.formState;
  const { setValue } = form;
  const errorCount = Object.keys(errors).length;
  const isPending = isSubmitting || submitContact.isPending;

  useEffect(() => {
    if (defaultService) {
      setValue('service', defaultService, { shouldDirty: false, shouldValidate: false });
    }
  }, [defaultService, setValue]);

  const onSubmit = async (values: BookPickupFormValues) => {
    setSubmitError(null);
    try {
      await submitContact.mutateAsync({
        name: values.name,
        phone: values.phone,
        subject: 'order-help',
        message: buildContactMessage(values),
      });
      toast.success("Pickup request sent — we'll call or WhatsApp you shortly.");
      form.reset({
        name: '',
        phone: '',
        service: resolvedService,
        preferredTime: 'flexible',
        message: '',
      });
      onSuccess?.();
    } catch (error) {
      const hasFieldErrors = applyApiFieldErrors(error, form.setError);
      const message = getMarketingSubmitErrorMessage(
        error,
        'Could not send your request. Try again or call us directly.',
      );
      setSubmitError(
        hasFieldErrors ? 'Please fix the highlighted fields and try again.' : message,
      );
      toast.error(hasFieldErrors ? 'Please check the highlighted fields.' : message);
    }
  };

  const onInvalid = () => {
    setSubmitError('Please fix the highlighted fields and try again.');
  };

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(onSubmit, onInvalid)}
      noValidate
    >
      <div aria-live="polite" aria-atomic="true">
        {submitError ? (
          <p
            className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
            role="alert"
          >
            {submitError}
          </p>
        ) : null}
        {errorCount > 0 && form.formState.isSubmitted ? (
          <p
            className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
            role="alert"
          >
            {errorCount} field{errorCount === 1 ? '' : 's'} need{errorCount === 1 ? 's' : ''} your
            attention.
          </p>
        ) : null}
      </div>

      <FormField id={`${idPrefix}-name`} label="Your name" error={errors.name?.message} required>
        <Input
          id={`${idPrefix}-name`}
          autoComplete="name"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? `${idPrefix}-name-error` : undefined}
          className={cn(errors.name && 'border-destructive')}
          {...form.register('name')}
        />
      </FormField>

      <FormField
        id={`${idPrefix}-phone`}
        label="Phone"
        error={errors.phone?.message}
        required
        hint="We'll call or WhatsApp you to confirm pickup."
      >
        <Input
          id={`${idPrefix}-phone`}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+919876543210"
          aria-invalid={errors.phone ? true : undefined}
          aria-describedby={
            [errors.phone ? `${idPrefix}-phone-error` : null, `${idPrefix}-phone-hint`]
              .filter(Boolean)
              .join(' ') || undefined
          }
          className={cn(errors.phone && 'border-destructive')}
          {...form.register('phone')}
        />
      </FormField>

      <FormField
        id={`${idPrefix}-service`}
        label="Service"
        error={errors.service?.message}
        required
      >
        <Select
          id={`${idPrefix}-service`}
          aria-invalid={errors.service ? true : undefined}
          aria-describedby={errors.service ? `${idPrefix}-service-error` : undefined}
          className={cn(errors.service && 'border-destructive')}
          {...form.register('service')}
        >
          {BOOK_NOW_SERVICES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField
        id={`${idPrefix}-preferred-time`}
        label="Preferred pickup time"
        error={errors.preferredTime?.message}
        required
      >
        <Select
          id={`${idPrefix}-preferred-time`}
          aria-invalid={errors.preferredTime ? true : undefined}
          aria-describedby={
            errors.preferredTime ? `${idPrefix}-preferred-time-error` : undefined
          }
          className={cn(errors.preferredTime && 'border-destructive')}
          {...form.register('preferredTime')}
        >
          {BOOK_NOW_PREFERRED_TIMES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField
        id={`${idPrefix}-message`}
        label="Notes (optional)"
        error={errors.message?.message}
        hint="Address landmark, garment count, or anything we should know."
      >
        <Textarea
          id={`${idPrefix}-message`}
          rows={3}
          placeholder="e.g. Near Koramangala water tank, ~8 kg wash & fold"
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={
            [
              errors.message ? `${idPrefix}-message-error` : null,
              `${idPrefix}-message-hint`,
            ]
              .filter(Boolean)
              .join(' ') || undefined
          }
          className={cn(errors.message && 'border-destructive')}
          {...form.register('message')}
        />
      </FormField>

      <Button
        type="submit"
        size="lg"
        className="h-11 w-full rounded-full"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Sending…
          </>
        ) : (
          'Schedule pickup'
        )}
      </Button>
    </form>
  );
}

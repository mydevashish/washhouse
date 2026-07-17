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
  CONTACT_FORM_ANCHOR,
  CONTACT_SUBJECTS,
} from '@/features/marketing/contact/contact-constants';
import { useSubmitContact } from '@/features/marketing/hooks/use-marketing';
import { getMarketingSubmitErrorMessage } from '@/features/marketing/lib/marketing-form-errors';
import { applyApiFieldErrors } from '@/lib/api-field-errors';
import { cn } from '@/lib/utils';

const contactSubjectValues = CONTACT_SUBJECTS.map((s) => s.value) as [
  (typeof CONTACT_SUBJECTS)[number]['value'],
  ...(typeof CONTACT_SUBJECTS)[number]['value'][],
];

const contactFormSchema = z.object({
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
  email: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || z.string().email().safeParse(value).success, {
      message: 'Enter a valid email address',
    }),
  subject: z.enum(contactSubjectValues, { required_error: 'Pick a subject' }),
  message: z
    .string()
    .trim()
    .min(10, 'Tell us a bit more (at least 10 characters)')
    .max(2000, 'Message is too long (max 2000 characters)'),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

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

/**
 * Public marketing contact form — POST /marketing/contact.
 * `defaultSubject` comes from `/contact?subject=…` deep links.
 */
export function ContactForm({ defaultSubject }: { defaultSubject?: ContactFormValues['subject'] }) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submitContact = useSubmitContact();
  const resolvedSubject = defaultSubject ?? 'general';

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      subject: resolvedSubject,
      message: '',
    },
    mode: 'onBlur',
  });

  const { errors, isSubmitting } = form.formState;
  const { setValue } = form;
  const errorCount = Object.keys(errors).length;
  const isPending = isSubmitting || submitContact.isPending;

  // Soft-nav can reuse this client tree; keep subject in sync with the URL prop.
  useEffect(() => {
    setValue('subject', resolvedSubject, { shouldDirty: false, shouldValidate: false });
  }, [setValue, resolvedSubject]);

  const onSubmit = async (values: ContactFormValues) => {
    setSubmitError(null);
    try {
      await submitContact.mutateAsync({
        name: values.name,
        phone: values.phone,
        email: values.email?.trim() ? values.email.trim() : undefined,
        subject: values.subject,
        message: values.message,
      });
      toast.success("Message sent — we'll get back to you within one business day.");
      form.reset({
        name: '',
        phone: '',
        email: '',
        subject: resolvedSubject,
        message: '',
      });
    } catch (error) {
      const hasFieldErrors = applyApiFieldErrors(error, form.setError);
      const message = getMarketingSubmitErrorMessage(
        error,
        'Could not send your message. Try again or email us directly.',
      );
      setSubmitError(
        hasFieldErrors
          ? 'Please fix the highlighted fields and try again.'
          : message,
      );
      toast.error(
        hasFieldErrors ? 'Please check the highlighted fields.' : message,
      );
    }
  };

  const onInvalid = () => {
    setSubmitError('Please fix the highlighted fields and try again.');
  };

  return (
    <form
      id={CONTACT_FORM_ANCHOR}
      className="scroll-mt-20 space-y-5"
      onSubmit={form.handleSubmit(onSubmit, onInvalid)}
      noValidate
      aria-labelledby="contact-form-title"
    >
      <div>
        <h2 id="contact-form-title" className="text-xl font-bold text-foreground sm:text-2xl">
          Send us a message
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
          We usually reply within one business day (IST). For urgent order issues, mention your
          order ID in the message.
        </p>
      </div>

      <div aria-live="polite" aria-atomic="true">
        {submitError ? (
          <p className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger" role="alert">
            {submitError}
          </p>
        ) : null}
        {errorCount > 0 && form.formState.isSubmitted ? (
          <p className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger" role="alert">
            {errorCount} field{errorCount === 1 ? '' : 's'} need{errorCount === 1 ? 's' : ''} your
            attention.
          </p>
        ) : null}
      </div>

      <FormField id="contact-name" label="Your name" error={errors.name?.message} required>
        <Input
          id="contact-name"
          autoComplete="name"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? 'contact-name-error' : undefined}
          className={cn(errors.name && 'border-destructive')}
          {...form.register('name')}
        />
      </FormField>

      <FormField
        id="contact-phone"
        label="Phone"
        error={errors.phone?.message}
        required
        hint="We'll call or WhatsApp you back on this number."
      >
        <Input
          id="contact-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+919876543210"
          aria-invalid={errors.phone ? true : undefined}
          aria-describedby={
            [errors.phone ? 'contact-phone-error' : null, 'contact-phone-hint'].filter(Boolean).join(' ') ||
            undefined
          }
          className={cn(errors.phone && 'border-destructive')}
          {...form.register('phone')}
        />
      </FormField>

      <FormField id="contact-email" label="Email (optional)" error={errors.email?.message}>
        <Input
          id="contact-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? 'contact-email-error' : undefined}
          className={cn(errors.email && 'border-destructive')}
          {...form.register('email')}
        />
      </FormField>

      <FormField id="contact-subject" label="Subject" error={errors.subject?.message} required>
        <Select
          id="contact-subject"
          aria-invalid={errors.subject ? true : undefined}
          aria-describedby={errors.subject ? 'contact-subject-error' : undefined}
          className={cn(errors.subject && 'border-destructive')}
          {...form.register('subject')}
        >
          {CONTACT_SUBJECTS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField id="contact-message" label="Message" error={errors.message?.message} required>
        <Textarea
          id="contact-message"
          rows={5}
          placeholder="How can we help?"
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? 'contact-message-error' : undefined}
          className={cn(errors.message && 'border-destructive')}
          {...form.register('message')}
        />
      </FormField>

      <Button
        type="submit"
        size="lg"
        className="h-11 w-full rounded-full sm:w-auto"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Sending…
          </>
        ) : (
          'Send message'
        )}
      </Button>
    </form>
  );
}

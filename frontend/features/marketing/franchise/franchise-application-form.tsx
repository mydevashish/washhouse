'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useSubmitFranchiseInquiry } from '@/features/marketing/hooks/use-marketing';
import { getMarketingSubmitErrorMessage } from '@/features/marketing/lib/marketing-form-errors';
import { applyApiFieldErrors } from '@/lib/api-field-errors';
import { cn } from '@/lib/utils';

export const FRANCHISE_INVESTMENT_RANGES = [
  { value: '10-25', label: '₹10–25 lakh' },
  { value: '25-50', label: '₹25–50 lakh' },
  { value: '50-plus', label: '₹50 lakh+' },
  { value: 'unsure', label: 'Not sure yet' },
] as const;

const investmentRangeValues = FRANCHISE_INVESTMENT_RANGES.map((r) => r.value) as [
  (typeof FRANCHISE_INVESTMENT_RANGES)[number]['value'],
  ...(typeof FRANCHISE_INVESTMENT_RANGES)[number]['value'][],
];

const franchiseFormSchema = z.object({
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
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  city: z.string().trim().min(1, 'City is required').max(100),
  investment_range: z.enum(investmentRangeValues, {
    required_error: 'Select an investment range',
  }),
  message: z
    .string()
    .trim()
    .min(10, 'Tell us a bit more (at least 10 characters)')
    .max(2000, 'Message is too long (max 2000 characters)'),
});

export type FranchiseFormValues = z.infer<typeof franchiseFormSchema>;

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

export function FranchiseApplicationForm() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submitFranchise = useSubmitFranchiseInquiry();

  const form = useForm<FranchiseFormValues>({
    resolver: zodResolver(franchiseFormSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      city: '',
      investment_range: 'unsure',
      message: '',
    },
    mode: 'onBlur',
  });

  const { errors, isSubmitting } = form.formState;
  const errorCount = Object.keys(errors).length;
  const isPending = isSubmitting || submitFranchise.isPending;

  const onSubmit = async (values: FranchiseFormValues) => {
    setSubmitError(null);
    try {
      await submitFranchise.mutateAsync({
        name: values.name,
        phone: values.phone,
        email: values.email,
        city: values.city,
        investment_range: values.investment_range,
        message: values.message,
      });
      toast.success("Application received — we'll contact you within two business days.");
      form.reset({
        name: '',
        phone: '',
        email: '',
        city: '',
        investment_range: 'unsure',
        message: '',
      });
    } catch (error) {
      const hasFieldErrors = applyApiFieldErrors(error, form.setError);
      const message = getMarketingSubmitErrorMessage(
        error,
        'Could not submit your application. Try again or email us directly.',
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
      className="space-y-5"
      onSubmit={form.handleSubmit(onSubmit, onInvalid)}
      noValidate
      aria-labelledby="franchise-form-title"
    >
      <div>
        <h2 id="franchise-form-title" className="text-xl font-bold text-foreground sm:text-2xl">
          Apply for a franchise
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Share your details and our partnerships team will reach out with next steps, investment
          breakdown, and territory availability.
        </p>
      </div>

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

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="franchise-name" label="Your name" error={errors.name?.message} required>
          <Input
            id="franchise-name"
            autoComplete="name"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? 'franchise-name-error' : undefined}
            className={cn(errors.name && 'border-destructive')}
            {...form.register('name')}
          />
        </FormField>

        <FormField id="franchise-phone" label="Phone" error={errors.phone?.message} required>
          <Input
            id="franchise-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+919876543210"
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={errors.phone ? 'franchise-phone-error' : undefined}
            className={cn(errors.phone && 'border-destructive')}
            {...form.register('phone')}
          />
        </FormField>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="franchise-email" label="Email" error={errors.email?.message} required>
          <Input
            id="franchise-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? 'franchise-email-error' : undefined}
            className={cn(errors.email && 'border-destructive')}
            {...form.register('email')}
          />
        </FormField>

        <FormField id="franchise-city" label="City" error={errors.city?.message} required>
          <Input
            id="franchise-city"
            autoComplete="address-level2"
            placeholder="e.g. Bengaluru"
            aria-invalid={errors.city ? true : undefined}
            aria-describedby={errors.city ? 'franchise-city-error' : undefined}
            className={cn(errors.city && 'border-destructive')}
            {...form.register('city')}
          />
        </FormField>
      </div>

      <FormField
        id="franchise-investment"
        label="Investment range"
        error={errors.investment_range?.message}
        required
      >
        <Select
          id="franchise-investment"
          aria-invalid={errors.investment_range ? true : undefined}
          aria-describedby={errors.investment_range ? 'franchise-investment-error' : undefined}
          className={cn(errors.investment_range && 'border-destructive')}
          {...form.register('investment_range')}
        >
          {FRANCHISE_INVESTMENT_RANGES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField id="franchise-message" label="Message" error={errors.message?.message} required>
        <Textarea
          id="franchise-message"
          rows={5}
          placeholder="Tell us about your background, preferred location, and timeline."
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? 'franchise-message-error' : undefined}
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
            Submitting…
          </>
        ) : (
          'Submit application'
        )}
      </Button>
    </form>
  );
}

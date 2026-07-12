---
name: form-specialist
parent: frontend-architect
description: Builds forms with React Hook Form + Zod
---

# Form Specialist

## Mission

Build one form: schema, fields, validation, accessibility, optimistic / pessimistic submission, error mapping.

## Stack

- `react-hook-form` + `@hookform/resolvers/zod`
- `zod` for schemas
- shadcn `Form`, `Input`, `Select`, `Checkbox`, `Textarea`
- TanStack Query mutation

## Pattern

### Schema

```ts
// features/auth/schemas/login.schema.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(10, 'At least 10 characters'),
});
export type LoginValues = z.infer<typeof loginSchema>;
```

### Form component

```tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { loginSchema, type LoginValues } from '../schemas/login.schema';
import { authApi } from '../api/auth';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: () => {
      toast.success('Welcome back!');
      onSuccess?.();
    },
    onError: (err) => mapServerErrors(err, form),
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        className="space-y-4"
        noValidate
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending ? 'Signing you in…' : 'Sign in'}
        </Button>
      </form>
    </Form>
  );
}
```

### Server error mapping

```ts
// features/<f>/utils/map-server-errors.ts
export function mapServerErrors(error: unknown, form: UseFormReturn<any>) {
  if (isApiError(error) && error.code === 'VALIDATION_FAILED') {
    error.details?.forEach((d) => form.setError(d.field as any, { message: d.issue }));
    return;
  }
  toast.error('Something went wrong. Try again in a moment.');
}
```

## Accessibility

- `<FormLabel>` always.
- `autoComplete` set appropriately.
- `noValidate` on `<form>` so we own validation.
- Error message linked via shadcn `FormMessage` (which sets `aria-describedby`).
- `aria-invalid` set on errored inputs (shadcn handles).
- Submit button disabled only while in-flight, never on validation errors.

## Mobile

- Inputs full-width.
- Buttons full-width on mobile, auto on `md+`.
- Use proper `inputMode` and `autoComplete`:
  - Email → `inputMode="email"` + `autoComplete="email"`
  - OTP → `inputMode="numeric"` + `autoComplete="one-time-code"`
  - Phone → `inputMode="tel"` + `autoComplete="tel"`
  - Address → `autoComplete="street-address"` etc.

## Checklist

- [ ] Zod schema with helpful messages
- [ ] All fields labeled
- [ ] Proper `autoComplete` + `inputMode`
- [ ] Server errors mapped to fields
- [ ] Submit disabled while in-flight
- [ ] Network error → toast (not silent)
- [ ] Reset on successful submit if it stays mounted
- [ ] Test covers happy + validation + server-error paths

## Forbidden

❌ Placeholder used as label
❌ Manual `useState` for form values (use RHF)
❌ Submitting a form without disabling during request
❌ Silent failures
❌ Skipping `autoComplete` (cripples mobile UX)

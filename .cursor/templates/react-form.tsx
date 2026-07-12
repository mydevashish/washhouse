// Template: React Hook Form + Zod
// Save as: frontend/features/<f>/components/<name>-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';

import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const schema = z.object({
  // example fields:
  email: z.string().email('Enter a valid email'),
  password: z.string().min(10, 'At least 10 characters'),
});
type Values = z.infer<typeof schema>;

export interface <Name>FormProps {
  onSuccess?: () => void;
}

export function <Name>Form({ onSuccess }: <Name>FormProps) {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: async (values: Values) => {
      // call your API here
      return values;
    },
    onSuccess: () => {
      toast.success('Done');
      onSuccess?.();
    },
    onError: () => toast.error('Something went wrong'),
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
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
          {mutation.isPending ? 'Submitting…' : 'Submit'}
        </Button>
      </form>
    </Form>
  );
}

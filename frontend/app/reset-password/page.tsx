'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { ResetPasswordForm } from '@/features/auth/components/reset-password-form';
import { resetCodeFromSearchParams } from '@/features/auth/schemas/reset-password.schema';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const audience = searchParams.get('audience');
  const email = (searchParams.get('email') ?? '').trim();
  const code = resetCodeFromSearchParams(searchParams);

  useEffect(() => {
    document.title = 'Reset password · WashHouse';
  }, []);

  return (
    <ResetPasswordForm initialEmail={email} initialCode={code} audience={audience} />
  );
}

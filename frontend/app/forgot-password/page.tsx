'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { ForgotPasswordForm } from '@/features/auth/components/forgot-password-form';

export default function ForgotPasswordPage() {
  const searchParams = useSearchParams();
  const audience = searchParams.get('audience');

  useEffect(() => {
    document.title = 'Forgot password · WashHouse';
  }, []);

  return <ForgotPasswordForm audience={audience} />;
}

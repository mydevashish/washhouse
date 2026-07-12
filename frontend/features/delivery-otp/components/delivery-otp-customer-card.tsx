'use client';

import { Copy, KeyRound, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientDate } from '@/components/ui/client-date';
import { queryKeys } from '@/lib/query-keys';
import { getCustomerDeliveryOtp, type DeliveryVerificationStatus } from '@/services/delivery-otp';

type DeliveryOtpCustomerCardProps = {
  orderId: string;
  verification: DeliveryVerificationStatus | null | undefined;
};

export function DeliveryOtpCustomerCard({ orderId, verification }: DeliveryOtpCustomerCardProps) {
  const otpQ = useQuery({
    queryKey: queryKeys.deliveryOtp(orderId),
    queryFn: () => getCustomerDeliveryOtp(orderId),
    enabled: verification?.otp_available === true,
    staleTime: 60_000,
  });

  if (!verification) return null;

  if (verification.is_verified) {
    return (
      <Card className="rounded-2xl border-success/30 bg-success-muted/30 ring-1 ring-success/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base text-success">
            <KeyRound className="h-5 w-5" aria-hidden />
            Delivery verified
          </CardTitle>
          <CardDescription>
            OTP confirmed
            {verification.verified_at && (
              <>
                {' '}
                at <ClientDate iso={verification.verified_at} mode="datetime" />
              </>
            )}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (verification.status !== 'active') return null;

  const otp = otpQ.data?.otp_code;

  function copyOtp() {
    if (!otp) return;
    void navigator.clipboard.writeText(otp);
    toast.success('Delivery code copied');
  }

  return (
    <Card className="rounded-2xl border-primary/40 ring-2 ring-primary/15">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <KeyRound className="h-5 w-5 text-primary" aria-hidden />
          Your delivery code
        </CardTitle>
        <CardDescription>
          Share this 6-digit code with the delivery agent only when you receive your laundry.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {otpQ.isLoading && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {otp && (
          <button
            type="button"
            onClick={copyOtp}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-muted px-4 py-5"
            aria-label={`Copy delivery code ${otp.split('').join(' ')}`}
          >
            <span className="font-mono text-4xl font-bold tracking-[0.35em] tabular-nums">{otp}</span>
            <Copy className="h-5 w-5 text-muted-foreground" aria-hidden />
          </button>
        )}
        {verification.expires_at && (
          <p className="text-center text-xs text-muted-foreground">
            Expires <ClientDate iso={verification.expires_at} mode="datetime" />
          </p>
        )}
      </CardContent>
    </Card>
  );
}

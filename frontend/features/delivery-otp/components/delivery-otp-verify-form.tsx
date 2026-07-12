'use client';

import { useState } from 'react';
import { KeyRound, Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { verifyDeliveryOtp, type DeliveryVerificationStatus } from '@/services/delivery-otp';

function readGeolocation(): Promise<{ latitude: number; longitude: number } | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 12_000 },
    );
  });
}

type DeliveryOtpVerifyFormProps = {
  orderId: string;
  verification: DeliveryVerificationStatus | null | undefined;
  onVerified?: () => void;
  disabled?: boolean;
};

export function DeliveryOtpVerifyForm({
  orderId,
  verification,
  onVerified,
  disabled,
}: DeliveryOtpVerifyFormProps) {
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!verification || verification.is_verified) return null;
  if (verification.status !== 'active') {
    return (
      <Card className="rounded-2xl border-destructive/30">
        <CardContent className="p-4 text-sm text-muted-foreground">
          Delivery OTP is {verification.status}. Contact support if needed.
        </CardContent>
      </Card>
    );
  }

  async function submit() {
    if (!/^\d{6}$/.test(code)) {
      toast.error('Enter the 6-digit code from the customer');
      return;
    }
    setSubmitting(true);
    try {
      const gps = await readGeolocation();
      await verifyDeliveryOtp(orderId, {
        code,
        latitude: gps?.latitude,
        longitude: gps?.longitude,
      });
      toast.success('Delivery completed');
      setCode('');
      onVerified?.();
    } catch {
      toast.error('Invalid code or account locked — try again');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="rounded-2xl border-primary/30 ring-1 ring-primary/15">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="h-5 w-5 text-primary" aria-hidden />
          Verify delivery OTP
        </CardTitle>
        <CardDescription>
          Ask the customer for their 6-digit code. Delivery cannot complete without it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`delivery-otp-${orderId}`}>Customer delivery code</Label>
          <Input
            id={`delivery-otp-${orderId}`}
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            placeholder="000000"
            value={code}
            disabled={disabled || submitting}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="h-12 text-center font-mono text-2xl tracking-[0.3em]"
            autoComplete="one-time-code"
          />
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          GPS location captured on successful verification
        </p>
        {verification.failed_attempts > 0 && (
          <p className="text-xs text-destructive">
            {verification.failed_attempts} failed attempt(s) on this order
          </p>
        )}
        <Button type="button" className="min-h-[44px] w-full" disabled={disabled || submitting} onClick={() => void submit()}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Verifying…
            </>
          ) : (
            'Complete delivery'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

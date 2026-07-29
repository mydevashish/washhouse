import { MarketingShell } from '@/components/layout/marketing-shell';

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <MarketingShell>{children}</MarketingShell>;
}

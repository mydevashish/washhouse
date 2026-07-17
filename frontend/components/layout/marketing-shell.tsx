import { SkipToContent } from '@/components/accessibility/skip-to-content';
import { MarketingFooter } from '@/components/layout/marketing-footer';
import { MarketingFooterContactActions } from '@/components/layout/marketing-footer-contact-actions';
import { MarketingShellChrome } from '@/components/layout/marketing-shell-chrome';
import { MarketingShellOverlays } from '@/components/layout/marketing-shell-overlays';

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing-readable flex min-h-screen min-w-0 flex-col overflow-x-clip bg-muted/30">
      <SkipToContent />
      <MarketingShellChrome />
      <main
        id="main-content"
        className="min-w-0 max-w-full flex-1 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] focus:outline-none lg:pb-0"
        tabIndex={-1}
      >
        {children}
      </main>
      <MarketingFooter desktopContactActions={<MarketingFooterContactActions />} />
      <MarketingShellOverlays />
    </div>
  );
}

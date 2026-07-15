'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Loader2, Phone, Save } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { InfoBanner } from '@/components/ui/info-banner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
import { usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';
import { StorefrontFacilitiesSection } from '@/features/partner/storefront/sections/facilities-section';
import { StorefrontGallerySection } from '@/features/partner/storefront/sections/gallery-section';
import { StorefrontHighlightsSection } from '@/features/partner/storefront/sections/highlights-section';
import { StorefrontMachinesSection } from '@/features/partner/storefront/sections/machines-section';
import { StorefrontTeamCertsSection } from '@/features/partner/storefront/sections/team-certs-section';
import { StorefrontTemplatesSection } from '@/features/partner/storefront/sections/templates-section';
import { useOnlineBookingEnabled } from '@/lib/hooks/use-online-booking-enabled';
import { HORIZONTAL_SCROLL_TOUCH_CLASS } from '@/lib/horizontal-scroll-touch';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/lib/utils';
import { STALE } from '@/lib/query-config';
import {
  applyStorefrontTemplate,
  getPartnerStorefront,
  getStorefrontOptions,
  listStorefrontTemplates,
  updatePartnerStorefront,
  type StorefrontData,
} from '@/services/storefront';

type BuilderTab =
  | 'brand'
  | 'profile'
  | 'gallery'
  | 'facilities'
  | 'highlights'
  | 'machines'
  | 'team';

const TABS: { id: BuilderTab; label: string }[] = [
  { id: 'brand', label: 'Brand & template' },
  { id: 'profile', label: 'Store profile' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'facilities', label: 'Facilities' },
  { id: 'highlights', label: 'Why choose us' },
  { id: 'machines', label: 'Machines' },
  { id: 'team', label: 'Team & certs' },
];

export function PartnerStorefrontBuilderView() {
  const queriesEnabled = usePartnerQueriesEnabled();
  const { enabled: onlineBookingEnabled, isLoading: onlineBookingLoading } = useOnlineBookingEnabled();
  const qc = useQueryClient();
  const [tab, setTab] = useState<BuilderTab>('brand');
  const [draft, setDraft] = useState<StorefrontData | null>(null);

  const storefrontQ = useQuery({
    queryKey: queryKeys.partnerStorefront(),
    queryFn: getPartnerStorefront,
    staleTime: STALE.partnerAnalytics,
    enabled: queriesEnabled,
  });

  const templatesQ = useQuery({
    queryKey: queryKeys.partnerStorefrontTemplates(),
    queryFn: listStorefrontTemplates,
    staleTime: STALE.partnerAnalytics,
    enabled: queriesEnabled,
  });

  const optionsQ = useQuery({
    queryKey: ['partner-storefront-options'],
    queryFn: getStorefrontOptions,
    enabled: queriesEnabled,
  });

  const data = draft ?? storefrontQ.data;
  const offlineBookingMode = !onlineBookingLoading && !onlineBookingEnabled;
  const missingContactPhone = !data?.contact_phone?.trim();

  const saveMut = useMutation({
    mutationFn: (patch: Partial<StorefrontData>) => updatePartnerStorefront(patch),
    onSuccess: (saved) => {
      qc.setQueryData(queryKeys.partnerStorefront(), saved);
      setDraft(null);
      toast.success('Storefront saved');
    },
    onError: () => toast.error('Could not save storefront'),
  });

  const templateMut = useMutation({
    mutationFn: applyStorefrontTemplate,
    onSuccess: (saved) => {
      qc.setQueryData(queryKeys.partnerStorefront(), saved);
      setDraft(null);
      toast.success('Template applied');
    },
    onError: () => toast.error('Could not apply template'),
  });

  const patch = useCallback((partial: Partial<StorefrontData>) => {
    setDraft((prev) => ({ ...(prev ?? storefrontQ.data!), ...partial }));
  }, [storefrontQ.data]);

  function save() {
    if (!draft) return;
    const { laundry_id: _id, completeness_score: _s, ...patchBody } = draft;
    saveMut.mutate(patchBody);
  }

  if (!queriesEnabled || storefrontQ.isPending) {
    return (
      <PartnerContent className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </PartnerContent>
    );
  }

  if (!data) {
    return (
      <PartnerContent>
        <p className="text-sm text-muted-foreground">Could not load storefront. Try again later.</p>
      </PartnerContent>
    );
  }

  const dirty = Boolean(draft);
  const score = data.completeness_score;

  return (
    <PartnerContent className="space-y-5 pb-10">
      <PartnerPageHeader
        title="Storefront builder"
        description="Design your custom shop — customers see this when they open your listing."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href={`/discover/${data.laundry_id}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1.5 h-4 w-4" />
                Preview shop
              </Link>
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!dirty || saveMut.isPending}
              onClick={save}
            >
              {saveMut.isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-1.5 h-4 w-4" />
              )}
              Save changes
            </Button>
          </div>
        }
      />

      {offlineBookingMode && missingContactPhone && (
        <InfoBanner variant="warning" icon={Phone} title="Contact number missing">
          Customers book by phone — add a contact number to appear on your public page.
        </InfoBanner>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Store completeness</CardTitle>
          <CardDescription>
            Complete profiles rank higher in discovery. Upload images, add facilities, and tell your
            story.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{score}% complete</span>
            <span className="text-muted-foreground">{score >= 85 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs work'}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${score}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <div
        className={cn(
          'flex gap-1 overflow-x-auto border-b border-border/60 pb-px',
          HORIZONTAL_SCROLL_TOUCH_CLASS,
        )}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-t-lg px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'brand' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <StorefrontTemplatesSection
            templates={templatesQ.data ?? []}
            currentId={data.template_id}
            loading={templateMut.isPending}
            onApply={(id) => templateMut.mutate(id)}
          />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Brand colors & banner</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="brand_primary">Primary color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="brand_primary"
                      type="color"
                      value={data.brand_primary ?? '#1e3a5f'}
                      onChange={(e) => patch({ brand_primary: e.target.value })}
                      className="h-10 w-14 cursor-pointer p-1"
                    />
                    <Input
                      value={data.brand_primary ?? ''}
                      onChange={(e) => patch({ brand_primary: e.target.value })}
                      placeholder="#1e3a5f"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand_secondary">Accent color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="brand_secondary"
                      type="color"
                      value={data.brand_secondary ?? '#c9a227'}
                      onChange={(e) => patch({ brand_secondary: e.target.value })}
                      className="h-10 w-14 cursor-pointer p-1"
                    />
                    <Input
                      value={data.brand_secondary ?? ''}
                      onChange={(e) => patch({ brand_secondary: e.target.value })}
                      placeholder="#c9a227"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cover_url">Cover banner URL</Label>
                <Input
                  id="cover_url"
                  value={data.cover_url ?? ''}
                  onChange={(e) => patch({ cover_url: e.target.value || null })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo_url">Shop logo URL</Label>
                <Input
                  id="logo_url"
                  value={data.logo_url ?? ''}
                  onChange={(e) => patch({ logo_url: e.target.value || null })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={data.tagline ?? ''}
                  onChange={(e) => patch({ tagline: e.target.value || null })}
                  maxLength={300}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Store profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="brand_story">About / brand story</Label>
              <Textarea
                id="brand_story"
                rows={5}
                value={data.brand_story ?? ''}
                onChange={(e) => patch({ brand_story: e.target.value || null })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner_name">Owner name</Label>
              <Input
                id="owner_name"
                value={data.owner_name ?? ''}
                onChange={(e) => patch({ owner_name: e.target.value || null })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="years">Years in business</Label>
              <Input
                id="years"
                type="number"
                min={0}
                value={data.years_in_business ?? ''}
                onChange={(e) =>
                  patch({
                    years_in_business: e.target.value ? Number(e.target.value) : null,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Contact number</Label>
              <Input
                id="phone"
                value={data.contact_phone ?? ''}
                onChange={(e) => patch({ contact_phone: e.target.value || null })}
                required={offlineBookingMode}
              />
              {offlineBookingMode && missingContactPhone && (
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Customers book by phone — add a contact number to appear on your public page.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp number</Label>
              <Input
                id="whatsapp"
                value={data.whatsapp_number ?? ''}
                onChange={(e) => patch({ whatsapp_number: e.target.value || null })}
                placeholder="Same as contact or separate"
              />
            </div>
            <div className="sm:col-span-2 flex flex-wrap gap-4 pt-1">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={data.show_call ?? true} onChange={(e) => patch({ show_call: e.target.checked })} />
                Show call button
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={data.show_whatsapp ?? true} onChange={(e) => patch({ show_whatsapp: e.target.checked })} />
                Show WhatsApp
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={data.show_callback ?? true} onChange={(e) => patch({ show_callback: e.target.checked })} />
                Show callback request
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={data.is_published} onChange={(e) => patch({ is_published: e.target.checked })} />
                Published storefront
              </label>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="hours">Working hours (JSON)</Label>
              <Textarea
                id="hours"
                rows={3}
                value={JSON.stringify(data.working_hours ?? {}, null, 2)}
                onChange={(e) => {
                  try {
                    patch({ working_hours: JSON.parse(e.target.value) as Record<string, string> });
                  } catch {
                    /* ignore invalid json while typing */
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pickup_km">Pickup radius (km)</Label>
              <Input
                id="pickup_km"
                type="number"
                min={0}
                step={0.5}
                value={data.pickup_radius_km ?? ''}
                onChange={(e) => patch({ pickup_radius_km: e.target.value || null })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery_km">Delivery radius (km)</Label>
              <Input
                id="delivery_km"
                type="number"
                min={0}
                step={0.5}
                value={data.delivery_radius_km ?? ''}
                onChange={(e) => patch({ delivery_radius_km: e.target.value || null })}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'gallery' && (
        <StorefrontGallerySection
          gallery={data.gallery}
          categories={optionsQ.data?.gallery_categories ?? []}
          onChange={(gallery) => patch({ gallery })}
        />
      )}

      {tab === 'facilities' && (
        <StorefrontFacilitiesSection
          selected={data.facilities}
          options={optionsQ.data?.facilities ?? []}
          onChange={(facilities) => patch({ facilities })}
        />
      )}

      {tab === 'highlights' && (
        <StorefrontHighlightsSection
          highlights={data.highlights}
          onChange={(highlights) => patch({ highlights })}
        />
      )}

      {tab === 'machines' && (
        <StorefrontMachinesSection
          machines={data.machines}
          onChange={(machines) => patch({ machines })}
        />
      )}

      {tab === 'team' && (
        <StorefrontTeamCertsSection
          team={data.team}
          certifications={data.certifications}
          onTeamChange={(team) => patch({ team })}
          onCertsChange={(certifications) => patch({ certifications })}
        />
      )}
    </PartnerContent>
  );
}

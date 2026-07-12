'use client';

import { Search } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type HomeSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  isSearching?: boolean;
};

export function HomeSearchBar({ value, onChange, isSearching = false }: HomeSearchBarProps) {
  return (
    <Card className="shadow-soft">
      <CardContent className="p-4 sm:p-5">
        <Label htmlFor="laundry-search" className="text-base font-semibold text-foreground">
          Search laundries
        </Label>
        <p className="mt-1 text-sm text-muted-foreground">
          {isSearching
            ? 'Searching laundries, services, and addresses…'
            : 'Find by store name, service, tag, or neighbourhood'}
        </p>
        <div className="relative mt-4">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="laundry-search"
            type="search"
            placeholder="e.g. Sparkle Laundry, Koramangala…"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="pl-10"
            aria-describedby="laundry-search-hint"
          />
        </div>
        <p id="laundry-search-hint" className="sr-only">
          Results update as you type
        </p>
      </CardContent>
    </Card>
  );
}

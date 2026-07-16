'use client';

import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { filterSearchItems, getSearchIndex } from '@/lib/navigation/search-index';
import type { AppContext } from '@/lib/navigation/types';
import { cn } from '@/lib/utils';

type SearchContextValue = {
  openSearch: () => void;
};

const SearchContext = createContext<SearchContextValue | null>(null);

function useSearchContext(): SearchContextValue {
  const ctx = useContext(SearchContext);
  if (!ctx) {
    throw new Error('NavbarCommandSearch triggers must be used within NavbarCommandSearchRoot');
  }
  return ctx;
}

export function NavbarCommandSearchDesktopTrigger({ className }: { className?: string }) {
  const { openSearch } = useSearchContext();

  return (
    <button
      type="button"
      onClick={openSearch}
      className={cn(
        'hidden h-7 min-w-0 flex-1 items-center gap-1.5 rounded-md border border-border/50 bg-muted/30 px-2 text-xs text-muted-foreground transition-colors hover:border-border/70 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex md:max-w-sm',
        className,
      )}
      aria-label="Open search"
    >
      <Search className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="truncate">Search…</span>
      <kbd className="ml-auto hidden rounded border border-border/50 bg-background/80 px-1 py-px text-[10px] font-medium text-muted-foreground lg:inline">
        ⌘K
      </kbd>
    </button>
  );
}

export function NavbarCommandSearchMobileTrigger({ className }: { className?: string }) {
  const { openSearch } = useSearchContext();

  return (
    <button
      type="button"
      onClick={openSearch}
      className={cn(
        'inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden',
        className,
      )}
      aria-label="Search"
    >
      <Search className="h-3.5 w-3.5" />
    </button>
  );
}

export function NavbarCommandSearchRoot({
  app,
  children,
}: {
  app: AppContext;
  children: ReactNode;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const items = useMemo(() => getSearchIndex(app), [app]);
  const results = useMemo(() => filterSearchItems(items, query), [items, query]);

  const openSearch = useCallback(() => setOpen(true), []);

  const onSelect = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery('');
      router.push(href);
    },
    [router],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  return (
    <SearchContext.Provider value={{ openSearch }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg gap-0 overflow-hidden p-0 sm:rounded-xl">
          <DialogHeader className="border-b border-border/60 px-4 py-3">
            <DialogTitle className="text-base">Search</DialogTitle>
            <DialogDescription className="sr-only">
              Search pages and actions. Use arrow keys and enter to navigate.
            </DialogDescription>
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Orders, customers, settings…"
              className="mt-2 border-0 bg-muted/50 focus-visible:ring-1"
              aria-label="Search query"
            />
          </DialogHeader>
          <ul className="max-h-72 overflow-y-auto p-2" role="listbox">
            {results.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">No results</li>
            ) : (
              results.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={false}
                    className="flex w-full flex-col rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => onSelect(item.href)}
                  >
                    <span className="font-medium">{item.label}</span>
                    <span className="text-xs text-muted-foreground">{item.group}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </DialogContent>
      </Dialog>
    </SearchContext.Provider>
  );
}

/** @deprecated Use NavbarCommandSearchRoot + split triggers for a single dialog instance. */
export function NavbarCommandSearch({ app }: { app: AppContext }) {
  return (
    <NavbarCommandSearchRoot app={app}>
      <NavbarCommandSearchDesktopTrigger />
      <NavbarCommandSearchMobileTrigger />
    </NavbarCommandSearchRoot>
  );
}

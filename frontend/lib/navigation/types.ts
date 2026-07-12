export type AppContext = 'admin' | 'partner' | 'customer';

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export type SearchItem = {
  id: string;
  label: string;
  href: string;
  group: string;
  keywords?: string;
};

export type NavNotification = {
  id: string;
  title: string;
  body: string;
  href: string;
  createdAt: string;
  read: boolean;
  kind: 'order' | 'approval' | 'complaint' | 'payment' | 'partner' | 'system';
};

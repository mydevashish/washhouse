// Template: Next.js App Router page (Server Component by default)
// Save as: frontend/app/<segment>/page.tsx

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '<Page title>',
  description: '<Short description>',
};

export default async function Page() {
  // Server-side data fetching here (RSC)
  // const data = await fetchSomething();

  return (
    <main className="mx-auto w-full max-w-screen-xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl font-semibold md:text-3xl"><Page title></h1>
        <p className="mt-1 text-fg-2 md:text-lg">Subtitle</p>
      </header>

      {/* Compose feature components here */}
    </main>
  );
}

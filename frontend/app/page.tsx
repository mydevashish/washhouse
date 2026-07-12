import { redirect } from 'next/navigation';

/** Home → laundry listing (primary entry). */
export default function HomePage() {
  redirect('/discover');
}

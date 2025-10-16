import DashboardClient from './DashboardClient';
import { cookies, headers } from 'next/headers';

export default async function DashboardPage() {
  // Server-side fetch via internal proxy; explicitly forward cookies
  let initialData = null;
  try {
    const cookieHeader = cookies().toString();
    const res = await fetch(`/api/analytics/dashboard`, {
      cache: 'no-store',
      headers: {
        cookie: cookieHeader,
        // Forward user agent optionally for backend telemetry
        'x-forwarded-user-agent': headers().get('user-agent') || '',
      },
    });
    if (res.ok) {
      const json = await res.json();
      initialData = json?.data || json;
    }
  } catch (_) {}

  return <DashboardClient initialData={initialData} />;
}
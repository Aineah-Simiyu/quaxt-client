import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  // Server-side fetch via internal proxy; cookies forwarded automatically
  let initialData = null;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/analytics/dashboard`, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      initialData = json?.data || json;
    }
  } catch (_) {}

  return <DashboardClient initialData={initialData} />;
}
'use client';

import { useNotifiq } from '@/providers/notificationProvider';

export default function PushButton() {
  const { client, ready } = useNotifiq();

  const getToken = async () => {
    if (!ready) return;
    const token = await client.getToken(); // v2 instance method
    console.log('Got v2 token:', token);
  };

  return (
    <button onClick={getToken} disabled={!ready}>
      {ready ? 'Get push token' : 'Loading…'}
    </button>
  );
}
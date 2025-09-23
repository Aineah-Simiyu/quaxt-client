// app/providers/notifiq-provider.js
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createNotifiqClient } from 'notifiq-client';   // v2 named export
import { apiClient } from '@/lib/api';

const NotifiqCtx = createContext(null);

export function NotifiqProvider({ children, config }) {
  const [client] = useState(() => createNotifiqClient()); // single v2 instance
  const [ready, setReady] = useState(false);

  const registerUserToken = async (token) => {
    try {
      console.log("Registering token with server:", token.substring(0, 20) + "...");
      const newRes = await apiClient.post("/fcm-tokens", {
        token,
        deviceType: "web",
      });

      if (!newRes.ok) {
        throw new Error(`HTTP ${newRes.status}: ${newRes.statusText}`);
      }

      console.log("Token registered successfully");
    } catch (err) {
      console.error("Failed to register FCM token:", err);
    }
  };

  useEffect(() => {
    client
      .init(config)               // v2 instance method
      .then(async () => {
            const token = await client.getToken();
            console.info('this is token', token);
            const storedToken = JSON.parse(localStorage.getItem('fcm-token'));
            console.info('this is stored token', storedToken);
            if (storedToken !== token) {
                localStorage.setItem('fcm-token', JSON.stringify(token));
                await registerUserToken(token);
                setReady(true);
            } else {
                setReady(true);
            }
      })
      .catch((err) =>
        console.warn('[Notifiq] init failed – probably blocked', err)
      );

    return () => client.destroy(); // clean-up on unmount
  }, [client, config]);

  return (
    <NotifiqCtx.Provider value={{ client, ready }}>
      {children}
    </NotifiqCtx.Provider>
  );
}

/* helper hook for any client component */
export function useNotifiq() {
  const ctx = useContext(NotifiqCtx);
  if (!ctx) throw new Error('useNotifiq must be used inside NotifiqProvider');
  return ctx;
}
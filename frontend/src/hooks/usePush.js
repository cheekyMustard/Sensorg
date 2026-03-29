import { useState, useEffect, useCallback } from 'react';
import { getVapidKey, subscribePush, unsubscribePush } from '../api/push.js';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

/**
 * Returns:
 *   supported  – boolean (browser supports push)
 *   permission – 'default' | 'granted' | 'denied'
 *   subscribed – boolean (this device is subscribed)
 *   loading    – boolean
 *   subscribe  – async () => void
 *   unsubscribe – async () => void
 */
export function usePush() {
  const supported = typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window;

  const [permission,  setPermission]  = useState(supported ? Notification.permission : 'denied');
  const [subscribed,  setSubscribed]  = useState(false);
  const [loading,     setLoading]     = useState(false);

  // On mount: register SW and check if already subscribed
  useEffect(() => {
    if (!supported) return;

    async function init() {
      const reg = await navigator.serviceWorker.register('/sw.js');
      const existing = await reg.pushManager.getSubscription();
      setSubscribed(!!existing);
      setPermission(Notification.permission);
    }

    init().catch(console.error);
  }, [supported]);

  const subscribe = useCallback(async () => {
    if (!supported) return;
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return;

      const { key } = await getVapidKey();
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });

      const json = sub.toJSON();
      await subscribePush({ endpoint: json.endpoint, keys: json.keys });
      setSubscribed(true);
    } finally {
      setLoading(false);
    }
  }, [supported]);

  const unsubscribe = useCallback(async () => {
    if (!supported) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await unsubscribePush(sub.endpoint);
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } finally {
      setLoading(false);
    }
  }, [supported]);

  return { supported, permission, subscribed, loading, subscribe, unsubscribe };
}

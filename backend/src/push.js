import webpush from 'web-push';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

/**
 * Send a push notification to all subscriptions for a list of user ids.
 * Silently removes expired/invalid subscriptions (410 Gone).
 *
 * @param {import('pg').PoolClient} client
 * @param {string[]} userIds
 * @param {{ title: string, body: string }} payload
 */
export async function sendPushToUsers(client, userIds, payload) {
  if (!userIds.length) return;

  const { rows } = await client.query(
    'select id, endpoint, p256dh, auth from push_subscriptions where user_id = any($1)',
    [userIds]
  );

  const notification = JSON.stringify(payload);

  await Promise.allSettled(
    rows.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          notification,
        );
      } catch (err) {
        // 410 Gone or 404 = subscription expired → remove it
        if (err.statusCode === 410 || err.statusCode === 404) {
          await client.query('delete from push_subscriptions where id = $1', [sub.id]);
        } else {
          console.error('[push] sendNotification failed:', err.statusCode, err.message);
        }
      }
    })
  );
}

import { Resource } from 'sst';
import { ALERT_LEVEL } from './constants';

export const notify = async (alertLevel: ALERT_LEVEL, message: string) => {
  if (!Resource.DISCORD_WEBHOOK_URL.value || !Resource.DISCORD_USER_ID.value) {
    return;
  }

  /**
   * Send alert to Discord webhook
   */
  const payload =
    alertLevel === ALERT_LEVEL.ERROR
      ? {
          message: `<@${Resource.DISCORD_USER_ID.value}> ${message}`,
          flags: 1 << 12, // suppress notifs so im not spammed
        }
      : { message };
  const res = await fetch(Resource.DISCORD_WEBHOOK_URL.value, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    console.error(
      `Failed to send Discord webhook alert: ${res.status} ${res.statusText}`
    );
  }

  // Throw if error
  if (alertLevel === ALERT_LEVEL.ERROR) {
    throw new Error(message);
  } else {
    console.warn(message);
  }
};

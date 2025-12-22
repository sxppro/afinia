import {
  sendNotification,
  subscribeUser,
  unsubscribeUser,
} from '@/lib/actions/notification';
import { urlBase64ToUint8Array } from '@/lib/ui';
import { DialogProps } from '@radix-ui/react-dialog';
import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '../ui/field';
import { Switch } from '../ui/switch';

const UserSettings = (props: DialogProps) => {
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  );
  const [message, setMessage] = useState('');

  const registerServiceWorker = async () => {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/app',
      updateViaCache: 'none',
    });
    const sub = await registration.pushManager.getSubscription();
    setSubscription(sub);
  };

  const subscribeToPush = async () => {
    const registration = await navigator.serviceWorker.ready;

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return;
    }

    // Subscribe to push
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
      ),
    });
    setSubscription(sub);
    const serialisedSub = sub.toJSON();
    const { success } = await subscribeUser(serialisedSub);
    console.log('Subscribe result: ', success);
  };

  const unsubscribeFromPush = async () => {
    await subscription?.unsubscribe();
    setSubscription(null);
    const { success } = await unsubscribeUser();
    console.log('Unsubscribe result: ', success);
  };

  const sendTestNotification = async () => {
    if (subscription) {
      await sendNotification(message);
      setMessage('');
    }
  };

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      // Note: disabling as this should only run once
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsPushSupported(true);
      registerServiceWorker();
    }
  }, []);

  if (!isPushSupported) {
    console.error('Push notifications are not supported in this browser.');
  }

  return (
    <Dialog {...props}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <FieldGroup>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor="enable-notifications">
                Enable notifications
              </FieldLabel>
            </FieldContent>
            <Switch
              id="enable-notifications"
              checked={!!subscription}
              onCheckedChange={(e) =>
                e ? subscribeToPush() : unsubscribeFromPush()
              }
            />
            {isPushSupported ? null : (
              <FieldDescription>
                Push notifications are not supported in this browser.
              </FieldDescription>
            )}
          </Field>
          <Field>
            <Button
              disabled={!isPushSupported || !subscription}
              onClick={() => sendTestNotification()}
            >
              Send test
            </Button>
          </Field>
        </FieldGroup>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserSettings;

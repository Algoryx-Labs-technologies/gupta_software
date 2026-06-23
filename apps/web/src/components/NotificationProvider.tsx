import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  dismissNotification,
  subscribeToNotifications,
  type AppNotification,
} from '@/lib/notify';
import { Button } from './Button';

export function NotificationProvider() {
  const [notification, setNotification] = useState<AppNotification | null>(null);

  useEffect(() => subscribeToNotifications(setNotification), []);

  if (!notification) return null;

  const isSuccess = notification.type === 'success';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
        onClick={dismissNotification}
      />
      <div
        role="alertdialog"
        aria-live="assertive"
        aria-labelledby="notification-title"
        className={cn(
          'relative z-10 w-full max-w-sm rounded-2xl border bg-white p-6 shadow-2xl',
          isSuccess ? 'border-emerald-200' : 'border-red-200',
        )}
      >
        <div className="flex flex-col items-center text-center">
          <div
            className={cn(
              'mb-4 flex h-14 w-14 items-center justify-center rounded-full',
              isSuccess ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600',
            )}
          >
            {isSuccess ? (
              <CheckCircle2 className="h-8 w-8" strokeWidth={2.2} />
            ) : (
              <XCircle className="h-8 w-8" strokeWidth={2.2} />
            )}
          </div>
          <h2
            id="notification-title"
            className={cn(
              'text-base font-semibold',
              isSuccess ? 'text-emerald-800' : 'text-red-800',
            )}
          >
            {isSuccess ? 'Success' : 'Failed'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">{notification.message}</p>
          <Button className="mt-5 min-w-[120px]" onClick={dismissNotification}>
            OK
          </Button>
        </div>
      </div>
    </div>
  );
}

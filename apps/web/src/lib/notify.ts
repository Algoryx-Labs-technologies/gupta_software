import { playNotificationSound } from './notificationSound';

export type NotificationType = 'success' | 'error';

export interface AppNotification {
  id: number;
  type: NotificationType;
  message: string;
}

type Listener = (notification: AppNotification | null) => void;

let activeNotification: AppNotification | null = null;
let dismissTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener(activeNotification));
}

function clearDismissTimer() {
  if (dismissTimer) {
    clearTimeout(dismissTimer);
    dismissTimer = null;
  }
}

export function dismissNotification() {
  clearDismissTimer();
  activeNotification = null;
  emit();
}

function show(type: NotificationType, message: string) {
  playNotificationSound(type);
  clearDismissTimer();

  const notification: AppNotification = {
    id: Date.now(),
    type,
    message,
  };

  activeNotification = notification;
  emit();

  dismissTimer = setTimeout(() => {
    if (activeNotification?.id === notification.id) {
      dismissNotification();
    }
  }, 3200);
}

export const toast = {
  success: (message: string) => show('success', message),
  error: (message: string) => show('error', message),
};

export function subscribeToNotifications(listener: Listener) {
  listeners.add(listener);
  listener(activeNotification);
  return () => {
    listeners.delete(listener);
  };
}

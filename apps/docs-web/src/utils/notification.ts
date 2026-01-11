import { ref } from 'vue';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: number;
  type: NotificationType;
  message: string;
}

let notificationId = 0;
const notifications = ref<Notification[]>([]);

function add(type: NotificationType, message: string, duration = 3000) {
  const id = ++notificationId;
  notifications.value.push({ id, type, message });

  if (duration > 0) {
    setTimeout(() => {
      remove(id);
    }, duration);
  }

  return id;
}

function remove(id: number) {
  const index = notifications.value.findIndex((n) => n.id === id);
  if (index !== -1) {
    notifications.value.splice(index, 1);
  }
}

export const notification = {
  notifications,
  info: (message: string, duration?: number) => add('info', message, duration),
  success: (message: string, duration?: number) => add('success', message, duration),
  warning: (message: string, duration?: number) => add('warning', message, duration),
  error: (message: string, duration?: number) => add('error', message, duration),
  remove,
};

export default notification;

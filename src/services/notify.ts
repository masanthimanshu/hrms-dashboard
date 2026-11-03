type Severity = "success" | "info" | "warning" | "error";
type NotificationListener = (message: string, severity: Severity) => void;

const listeners: NotificationListener[] = [];

export const notify = (message: string, severity: Severity = "success") => {
  listeners.forEach((listener) => listener(message, severity));
};

export const subscribeNotification = (listener: NotificationListener) => {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  };
};

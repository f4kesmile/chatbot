type EventCallback = (data?: any) => void;

const events: Record<string, EventCallback[]> = {};

export const eventBus = {
  on(event: string, callback: EventCallback) {
    if (!events[event]) events[event] = [];
    events[event].push(callback);
  },
  off(event: string, callback: EventCallback) {
    if (!events[event]) return;
    events[event] = events[event].filter((cb) => cb !== callback);
  },
  emit(event: string, data?: any) {
    if (!events[event]) return;
    events[event].forEach((callback) => callback(data));
  },
};
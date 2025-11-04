export type EventMap = Record<string, unknown>;

export type Handler<E extends EventMap, K extends keyof E> = (payload: E[K]) => void;

type Subscriber<E extends EventMap, K extends keyof E> = {
  event: K;
  listener: Handler<E, K>;
};

export interface Subscribable<E extends EventMap> {
  subscribe<K extends keyof E>(event: K, listener: Handler<E, K>): void;
  unsubscribe<K extends keyof E>(event: K, handler: Handler<E, K>): void;
}

export class Emitter<E extends EventMap> implements Subscribable<E> {
  private subscribers: Subscriber<E, any>[] = [];

  constructor() {}

  destroy() {
    this.subscribers = [];
  }

  subscribe<K extends keyof E>(event: K, listener: Handler<E, K>) {
    this.subscribers.push({ event, listener });
  }

  unsubscribe<K extends keyof E>(event: K, listener: Handler<E, K>) {
    const idx = this.subscribers.findIndex(
      l => l.event === event && l.listener === listener
    );
    if (idx >= 0) {
      this.subscribers.splice(idx, 1);
    }
  }

  emit<K extends keyof E>(event: K, payload: E[K]) {
    const subscribers = this.subscribers.concat();
    subscribers
      .filter(s => s.event === event)
      .forEach(s => (s.listener as Handler<E, K>)(payload));
  }
}

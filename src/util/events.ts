export type EventMap = Record<string, unknown>;

export type Handler<E extends EventMap, K extends keyof E> = (payload: E[K]) => void;

type Subscriber<E extends EventMap, K extends keyof E> = {
  event: K;
  listener: Handler<E, K>;
};

export interface Subscribable<E extends EventMap> {
  subscribe<K extends keyof E>(
    event: K,
    listener: Handler<E, K>,
    notifyOnAdd?: boolean
  ): () => void;
  unsubscribe<K extends keyof E>(event: K, handler: Handler<E, K>): void;
}

export class Emitter<E extends EventMap> implements Subscribable<E> {
  private subscribers: Subscriber<E, any>[] = [];
  private states: Record<keyof E, any>;

  constructor(initialStates?: Record<keyof E, any>) {
    this.states = initialStates ?? ({} as Record<keyof E, any>);
  }

  destroy() {
    this.subscribers = [];
  }

  subscribe<K extends keyof E>(event: K, listener: Handler<E, K>, notifyOnAdd?: boolean) {
    this.subscribers.push({ event, listener });
    const payload = this.states?.[event];
    if (notifyOnAdd && payload) {
      listener(payload);
    }
    return () => {
      this.unsubscribe(event, listener);
    };
  }

  unsubscribe<K extends keyof E>(event: K, listener: Handler<E, K>) {
    const idx = this.subscribers.findIndex(
      l => l.event === event && l.listener === listener
    );
    if (idx >= 0) {
      this.subscribers.splice(idx, 1);
    }
  }

  setEventPayload<K extends keyof E>(event: K, payload: E[K]) {
    this.states[event] = payload;
  }

  emit<K extends keyof E>(event: K, payload: E[K]) {
    const subscribers = this.subscribers.concat();
    this.setEventPayload(event, payload);
    subscribers
      .filter(s => s.event === event)
      .forEach(s => (s.listener as Handler<E, K>)(payload));
  }
}

type ListenerFn = (args: any) => void;

type Subscriber<E extends string> = {
  event: E,
  listenerFn: ListenerFn
}

export class Dispatcher<E extends string> {
  private subscribers: Subscriber<E>[] = [];

  constructor() {    
  }

  subscribe(event: E, listenerFn: ListenerFn) {
    this.subscribers.push({ event, listenerFn });
  }

  unsubscribe(listenerFn: ListenerFn) {
    const idx = this.subscribers.findIndex((l) => (l.listenerFn === listenerFn));
    if (idx >= 0) {
      this.subscribers.splice(idx, 1);
    }
  }

  notify(event: E, args?: any) {
    this.subscribers.filter((s) => (s.event === event)).forEach((s) => (s.listenerFn(args ?? {})))
  }
}
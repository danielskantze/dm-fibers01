import type { EventMap, Subscribable } from "../../util/events";

export interface ComponentEventMap extends EventMap {
  accessory: {
    open: {
      sender: Component<ComponentEventMap>;
      isOpen: boolean;
    };
  };
}

export interface Component<T extends ComponentEventMap> {
  element: HTMLElement;
  events?: Subscribable<T>;
  update?: (props: any) => void;
  destroy?: () => void;
}

export type ComponentWithoutEvents = Component<ComponentEventMap>;

export type AccessoryOwnerComponent = Component<ComponentEventMap>;

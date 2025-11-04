import type { Subscribable } from "../../util/events";

export type ComponentEventMap = {
  accessory: {
    open: {
      sender: Component;
      isOpen: boolean;
    };
  };
};

export interface Component {
  element: HTMLElement;
  events?: Subscribable<ComponentEventMap>;
  update?: (props: any) => void;
  destroy?: () => void;
}

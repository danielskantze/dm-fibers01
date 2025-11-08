import type { UniformValue } from "../../types/gl/uniforms";
import type { AnyModifierConfig } from "../../service/parameters/modifiers/types";
import type { EventMap, Subscribable } from "../../util/events";

// 1. The new base component interface.
export interface Component<TEventMap extends EventMap = EventMap> {
  element: HTMLElement;
  events?: Subscribable<TEventMap>;
  destroy?: () => void;
}

// 2. Role-specific Event Maps.
export interface ComponentEventMap extends EventMap {} // A base map for common events.

export interface AccessoryOwnerEventMap extends ComponentEventMap {
  accessory: {
    open: {
      sender: AccessoryOwnerComponent;
      isOpen: boolean;
    };
  };
}

// 3. Role-specific Component Interfaces.
export interface ParameterComponent<TEventMap extends EventMap = ComponentEventMap>
  extends Component<TEventMap> {
  update: (value: UniformValue) => void;
}

// 4. Define AccessoryOwnerComponent using the specific event map.
export interface AccessoryOwnerComponent
  extends ParameterComponent<AccessoryOwnerEventMap> {
  events: Subscribable<AccessoryOwnerEventMap>;
}

// 5. The crucial type guard.
export function isAccessoryOwnerComponent(
  component: ParameterComponent
): component is AccessoryOwnerComponent {
  // A component is an accessory owner if it has an event bus.
  // In our design, only accessory owners will emit events.
  return component.events !== undefined;
}

import type { UniformValue } from "../../types/gl/uniforms";
import type { EventMap, Subscribable } from "../../util/events";

// 1. The new base component interface.
export interface Component<TEventMap extends EventMap = EventMap> {
  element: HTMLElement;
  events?: Subscribable<TEventMap>;
  destroy?: () => void;
}

// 2. Role-specific Event Maps.
export interface ComponentEventMap extends EventMap {} // A base map for common events.

export interface ModifierOwnerEventMap extends ComponentEventMap {
  modifiers: {
    open: {
      sender: ModifierOwnerComponent;
      isOpen: boolean;
    };
  };
}

// 3. Role-specific Component Interfaces.
export interface ParameterComponent<TEventMap extends EventMap = ComponentEventMap>
  extends Component<TEventMap> {
  update: (value: UniformValue) => void;
}

// 4. Define ModifierOwnerComponent using the specific event map.
// This component can display a modifier panel for managing parameter modifiers (LFO, audio analysis, etc.)
export interface ModifierOwnerComponent
  extends ParameterComponent<ModifierOwnerEventMap> {
  events: Subscribable<ModifierOwnerEventMap>;
  modifierButton?: {
    setHighlighted: (isHighlighted: boolean) => void;
  };
}

// 5. The crucial type guard.
export function isModifierOwnerComponent(
  component: ParameterComponent
): component is ModifierOwnerComponent {
  // A component is a modifier owner if it has an event bus.
  // In our design, only modifier owners will emit events.
  return component.events !== undefined;
}

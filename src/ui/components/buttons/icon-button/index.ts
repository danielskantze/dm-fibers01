import type { Emitter } from "../../../../util/events";
import type {
  AccessoryOwnerComponent,
  AccessoryOwnerEventMap,
  Component,
} from "../../types";
import "./icon-button.css";

import collapseIcon from "../../../icons/collapse.svg?raw";
import expandIcon from "../../../icons/expand.svg?raw";

interface ButtonComponent extends Component {
  updateButton: (svgIcon: string, title?: string) => void;
  setDisabled: (isDisabled: boolean) => void;
}

interface ButtonProps {
  svgIcon: string;
  title?: string;
  circular?: boolean;
  size: "small";
  onClick: () => void;
  color?: number;
}

export function createIconButton(props: ButtonProps): ButtonComponent {
  const { svgIcon, title, size, onClick, color, circular } = props;
  const container = document.createElement("div");
  container.classList.add("ui-component");
  container.classList.add("icon-button");
  if (circular) {
    container.classList.add("circular");
  }
  container.classList.add(`size-${size}`);
  const button = document.createElement("button") as HTMLButtonElement;
  container.appendChild(button);
  if (color !== undefined) {
    button.classList.add(`color-${color}`);
  }
  if (svgIcon) {
    button.innerHTML = svgIcon;
    if (title) {
      button.setAttribute("title", title);
    }
  }

  const clickHandler = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    if (!button.disabled) {
      onClick();
    }
  };
  button.addEventListener("click", clickHandler);

  return {
    element: container,
    updateButton: (svgIcon, title) => {
      if (svgIcon) {
        button.innerHTML = svgIcon;
        if (title) {
          button.setAttribute("title", title);
        }
      }
    },
    setDisabled: isDisabled => {
      button.disabled = isDisabled;
    },
    destroy: () => {
      button.removeEventListener("click", clickHandler);
    },
  };
}

interface ToggleButtonProps extends Omit<ButtonProps, "svgIcon"> {
  svgIcons: [string, string];
}

export interface ToggleButtonComponent extends Component {
  update: (value: boolean) => void;
}

export function createIconToggleButton(props: ToggleButtonProps): ToggleButtonComponent {
  const svgIcons = props.svgIcons;
  let newProps = { ...props, svgIcon: svgIcons[0] };
  const button = createIconButton(newProps);
  return {
    ...button,
    update: (value: boolean) => {
      button.updateButton(svgIcons[value ? 0 : 1], props.title);
    },
  };
}

export function createAccessoryButton(
  sender: AccessoryOwnerComponent,
  emitter: Emitter<AccessoryOwnerEventMap>
) {
  let isAccessoryCollapsed = true;
  const accessoryButton = createIconToggleButton({
    svgIcons: [expandIcon, collapseIcon],
    size: "small",
    circular: true,
    onClick: function (): void {
      isAccessoryCollapsed = !isAccessoryCollapsed;
      accessoryButton.update?.(isAccessoryCollapsed);
      emitter.emit("accessory", {
        open: {
          sender,
          isOpen: !isAccessoryCollapsed,
        },
      });
    },
  });
  return accessoryButton;
}

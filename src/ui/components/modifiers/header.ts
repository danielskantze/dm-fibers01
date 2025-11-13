import type { Component } from "../types";
import "./modifier.css";
import removeIcon from "../../icons/remove.svg?raw";
import moveUpIcon from "../../icons/collapse.svg?raw";
import moveDownIcon from "../../icons/expand.svg?raw";
import signalBypassedIcon from "../../icons/signal-bypassed.svg?raw";
import signalFlowingIcon from "../../icons/signal-flowing.svg?raw";

type Props = {
  title: string;
  icon: string;
  iconShiftY?: number;
  onRemove: (id: string) => void;
  onMoveUp: (id: string) => boolean;
  onMoveDown: (id: string) => boolean;
};

export interface ModifierHeaderComponent extends Component {
  initialize: (id: string) => void;
  setCanMoveDown: (value: boolean) => void;
  setCanMoveUp: (value: boolean) => void;
  setBypass: (value: boolean) => void;
  setOnBypass: (callback: (value: boolean) => void) => void;
}

export function createModifierHeader(props: Props): ModifierHeaderComponent {
  const { title, icon, iconShiftY, onRemove, onMoveDown, onMoveUp } = props;

  let modifierId = "";
  let isBypassed = false;

  function initialize(id: string) {
    modifierId = id;
  }
  // create header row items
  const container = document.createElement("div");
  const iconElement = document.createElement("div");
  const titleElement = document.createElement("div");
  const menuElement = document.createElement("div");
  const signalBypassElement = document.createElement("button");

  // bypass
  signalBypassElement.classList.add("bypass");
  signalBypassElement.innerHTML = signalBypassedIcon;
  signalBypassElement.onclick = () => {
    setBypass(!isBypassed);
  };

  // create menu items
  const menuRemoveElement = document.createElement("button");
  const menuMoveUpElement = document.createElement("button");
  const menuMoveDownElement = document.createElement("button");

  // setup header row
  container.classList.add("ui-component");
  container.classList.add("modifier-header");
  iconElement.classList.add("icon");
  iconElement.innerHTML = icon;
  if (iconShiftY) {
    iconElement.style.marginTop = `${iconShiftY}px`;
  }
  titleElement.classList.add("title");
  titleElement.innerText = title;
  menuElement.classList.add("menu");
  let bypassCallback: (value: boolean) => void = () => {};

  // setup menu
  menuElement.appendChild(menuRemoveElement);
  menuElement.appendChild(menuMoveUpElement);
  menuElement.appendChild(menuMoveDownElement);
  menuRemoveElement.innerHTML = removeIcon;
  menuMoveUpElement.innerHTML = moveUpIcon;
  menuMoveDownElement.innerHTML = moveDownIcon;
  menuRemoveElement.onclick = _ => onRemove(modifierId);
  menuMoveUpElement.onclick = _ => onMoveUp(modifierId);
  menuMoveDownElement.onclick = _ => onMoveDown(modifierId);

  function setCanMoveUp(value: boolean) {
    menuMoveUpElement.disabled = value;
  }

  function setCanMoveDown(value: boolean) {
    menuMoveDownElement.disabled = value;
  }

  function setBypass(value: boolean) {
    signalBypassElement.innerHTML = value ? signalBypassedIcon : signalFlowingIcon;
    isBypassed = value;
  }

  function setOnBypass(callback: (value: boolean) => void) {
    bypassCallback = callback;
  }

  // put it together
  container.appendChild(iconElement);
  container.appendChild(signalBypassElement);
  container.appendChild(titleElement);
  container.appendChild(menuElement);

  return {
    element: container,
    initialize,
    setCanMoveDown,
    setCanMoveUp,
    setBypass,
    setOnBypass,
  };
}

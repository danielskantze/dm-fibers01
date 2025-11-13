import type { Component } from "../types";
import "./modifier.css";
import removeIcon from "../../icons/remove.svg?raw";
import moveUpIcon from "../../icons/collapse.svg?raw";
import moveDownIcon from "../../icons/expand.svg?raw";

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

  function initialize(id: string) {
    modifierId = id;
  }
  // create header row items
  const container = document.createElement("div");
  const bypassCheckbox = document.createElement("input");
  const iconElement = document.createElement("div");
  const titleElement = document.createElement("div");
  const menuElement = document.createElement("div");

  //<input type="checkbox" class="expand-checkbox" name="type" value="expand"></input>
  bypassCheckbox.classList.add("bypass");
  bypassCheckbox.setAttribute("type", "checkbox");

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

  bypassCheckbox.onchange = () => bypassCallback(bypassCheckbox.checked);

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
    bypassCheckbox.checked = value;
  }

  function setOnBypass(callback: (value: boolean) => void) {
    bypassCallback = callback;
  }

  // put it together
  container.appendChild(iconElement);
  container.appendChild(bypassCheckbox);
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

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
}

export function createModifierHeader(props: Props): ModifierHeaderComponent {
  const { title, icon, iconShiftY, onRemove, onMoveDown, onMoveUp } = props;
  let modifierId = "";

  function initialize(id: string) {
    modifierId = id;
  }
  // create header row items
  const container = document.createElement("div");
  const iconElement = document.createElement("div");
  const titleElement = document.createElement("div");
  const menuElement = document.createElement("div");

  // create menu items
  const menuRemoveElement = document.createElement("div");
  const menuMoveUpElement = document.createElement("div");
  const menuMoveDownElement = document.createElement("div");

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

  // put it together
  container.appendChild(iconElement);
  container.appendChild(titleElement);
  container.appendChild(menuElement);

  return {
    element: container,
    initialize,
  };
}

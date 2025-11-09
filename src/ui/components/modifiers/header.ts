import type { Component } from "../types";
import "./modifier.css";
import removeIcon from "../../icons/remove.svg?raw";
import moveUpIcon from "../../icons/collapse.svg?raw";
import moveDownIcon from "../../icons/expand.svg?raw";

export function createModifierHeader(
  title: string,
  icon: string,
  iconShiftY?: number
): Component {
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

  container.appendChild(iconElement);
  container.appendChild(titleElement);
  container.appendChild(menuElement);

  return {
    element: container,
  };
}

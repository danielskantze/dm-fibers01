import type { ModifierOwnerComponent, Component } from "../../types";

export function attachModifierPanel(
  owner: ModifierOwnerComponent,
  panel: Component
): void {
  const parentNode = owner.element.parentNode;
  if (!parentNode) {
    return;
  }
  if (!owner.element.id) {
    console.error("Missing ID for modifier panel owner", owner.element);
    return;
  }
  const container = document.createElement("div");
  container.classList.add("ui-component");
  container.classList.add("modifier-panel");
  container.appendChild(panel.element);
  parentNode.insertBefore(container, owner.element.nextSibling);
  container.dataset.owner = owner.element.id;
}

export function removeModifierPanel(owner: ModifierOwnerComponent): void {
  const element = owner.element.parentNode?.querySelector(
    `div[data-owner="${owner.element.id}"`
  );
  if (element) {
    element.parentNode!.removeChild(element);
  }
}

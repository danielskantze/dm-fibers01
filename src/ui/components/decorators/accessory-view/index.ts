import type { AccessoryOwnerComponent } from "../../types";

export function attachAccessoryView(
  owner: AccessoryOwnerComponent,
  accessory: AccessoryOwnerComponent
): void {
  const parentNode = owner.element.parentNode;
  if (!parentNode) {
    return;
  }
  if (!owner.element.id) {
    console.error("Missing ID for accessory view owner", owner.element);
    return;
  }
  const container = document.createElement("div");
  container.classList.add("ui-component");
  container.classList.add("accessory");
  container.appendChild(accessory.element);
  parentNode.insertBefore(container, owner.element.nextSibling);
  container.dataset.owner = owner.element.id;
}

export function removeAccessoryView(owner: AccessoryOwnerComponent): void {
  const element = owner.element.parentNode?.querySelector(
    `div[data-owner="${owner.element.id}"`
  );
  if (element) {
    element.parentNode!.removeChild(element);
  }
}

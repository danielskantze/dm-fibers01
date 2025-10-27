import { Emitter, type Subscribable } from "../../../util/events";
import type { Component } from "../types";
import "./dropdown.css";
import template from "./dropdown.html?raw";

// The shallow object the dropdown works with.
export type DropdownItem = {
  id: string;
  name: string;
};

// Events emit IDs, not full objects.
export type DropdownEvents = {
  select: { id: string | undefined };
  add: { name: string };
  rename: { id: string; newName: string };
  delete: { id: string };
  edit: { type: "begin" | "end" };
};

export type DropdownProps = {
  id: string;
  items: DropdownItem[];
  selectedId?: string;
  canAdd?: boolean;
  canEdit?: boolean;
  canRemove?: boolean;
};

export interface DropdownUIComponent extends Component {
  element: HTMLElement;
  events: Subscribable<DropdownEvents>;

  // Public methods for the parent to control the dropdown.
  setItems(items: DropdownItem[], selectedId?: string): void;
  select(id?: string): void;
  setDisabled(state: boolean): void;
}

export function createDropdown(props: DropdownProps): DropdownUIComponent {
  const {
    id,
    items,
    selectedId,
    canAdd = true,
    canEdit = true,
    canRemove = true,
  } = props;
  const emitter = new Emitter<DropdownEvents>();
  let isDisabled = false;
  let currentItems = [...items];

  const wrapper = document.createElement("div");
  wrapper.innerHTML = template;
  const addButton = wrapper.querySelector(".add-button")! as HTMLButtonElement;
  const removeButton = wrapper.querySelector(".remove-button")! as HTMLButtonElement;
  const select = wrapper.querySelector("select")! as HTMLSelectElement;
  const selectTrigger = wrapper.querySelector(".trigger")! as HTMLElement;
  const editInput = wrapper.querySelector(".edit-input")! as HTMLInputElement;
  select.id = `id-${id}`;

  let blurListener: ((e: Event) => void) | undefined;

  function setDisabled(value: boolean) {
    select.disabled = value;
    editInput.disabled = value;
    addButton.disabled = value;
    removeButton.disabled = value;
    isDisabled = value;
  }

  function createOption(t: DropdownItem) {
    const option = document.createElement("option");
    option.text = t.name;
    option.value = t.id;
    return option;
  }

  function getSelectedItem(): DropdownItem | undefined {
    return currentItems.find(i => i.id === select.value);
  }

  function setItems(newItems: DropdownItem[], newSelectedId?: string) {
    currentItems = [...newItems];
    const anId =
      newSelectedId ??
      select.value ??
      (currentItems.length > 0 ? currentItems[0].id : undefined);

    select.innerHTML = "";
    for (const item of currentItems) {
      select.appendChild(createOption(item));
    }
    if (anId) {
      select.value = anId;
    }
  }

  setItems(items, selectedId);

  // Select handler

  const onSelectChange = () => {
    emitter.emit("select", { id: select.value });
  };
  select.addEventListener("change", onSelectChange);

  // Rename
  let onSelectTriggerClick: (() => void) | undefined;
  if (canEdit) {
    onSelectTriggerClick = () => {
      if (isDisabled) {
        return;
      }
      selectTrigger.style.display = "none";
      editInput.style.display = "block";
      editInput.focus();
      const selectedItem = getSelectedItem();
      editInput.value = selectedItem?.name ?? "";
      emitter.emit("edit", { type: "begin" });
      blurListener = (e: Event) => {
        if (e.target !== editInput) {
          selectTrigger.style.display = "block";
          editInput.style.display = "none";
          emitter.emit("rename", { id: select.value, newName: editInput.value });
          if (blurListener) {
            document.removeEventListener("mousedown", blurListener);
          }
          emitter.emit("edit", { type: "end" });
        }
      };
      document.addEventListener("mousedown", blurListener);
    };
    selectTrigger.addEventListener("click", onSelectTriggerClick);
  }

  // Add handler

  let onAddButtonClick: (() => void) | undefined;
  if (canAdd) {
    onAddButtonClick = () => {
      emitter.emit("add", { name: "New" });
    };
    addButton.addEventListener("click", onAddButtonClick);
  } else {
    addButton.style.display = "none";
  }

  // Remove handler
  let onRemoveButtonClick: (() => void) | undefined;
  if (canRemove) {
    onRemoveButtonClick = () => {
      if (currentItems.length <= 1) {
        return;
      }
      const removeId = select.value;
      emitter.emit("delete", { id: removeId });
    };
    removeButton.addEventListener("click", onRemoveButtonClick);
  } else {
    removeButton.style.display = "none";
  }

  return {
    element: wrapper,
    update: () => {},
    select: (id: string | undefined) => {
      select.value = id ?? "";
    },
    setItems,
    events: emitter,
    setDisabled,
    destroy: () => {
      select.removeEventListener("change", onSelectChange);
      if (canEdit && onSelectTriggerClick) {
        selectTrigger.removeEventListener("click", onSelectTriggerClick);
      }
      if (onAddButtonClick) {
        addButton.removeEventListener("click", onAddButtonClick);
      }
      if (canRemove && onRemoveButtonClick) {
        removeButton.removeEventListener("click", onRemoveButtonClick);
      }
      if (blurListener) {
        document.removeEventListener("mousedown", blurListener);
      }
    },
  };
}

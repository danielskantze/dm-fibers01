import { Emitter, type Subscribable } from '../../../util/events';
import type { UIComponent } from '../types';
import './dropdown.css';
import template from "./dropdown.html?raw";

export type DropdownItem = {
  id: string;
  name: string;
}

export class ItemManager<T extends DropdownItem> {
  private _items: T[];
  constructor(items: T[]) {
    this._items = items;
  }
  get items(): T[] {
    return this._items;
  }
  clear()  {
    this._items = [];
  }
  item(id: string): T | undefined {
    return this._items.find((i) => (i.id === id));
  }
  itemAt(index: number): T | undefined {
    return this._items[index];
  }
  indexOf(itemOrIndex: T | string): number {
    const id = typeof(itemOrIndex) === "string" ? itemOrIndex : itemOrIndex.id;
    return this._items.findIndex((i) => (i.id === id));
  }
  add(item: T) {
    this._items.push(item);
  }
  addAll(items: T[]) {
    this._items.push(...items);
  }
  remove(id: string): number {
    if (this._items.length <= 1) {
      return -1;
    }
    const i = this._items.findIndex((i) => i.id === id);
    this._items.splice(i, 1);
    return Math.min(i, this._items.length - 1);
  }
  update(item: T) {
    const i = this._items.findIndex((i) => i.id === item.id);
    this._items[i] = item;
  }
}

export type DropdownEvents<T extends DropdownItem> = {
  select: {
    index: number,
    item: T | undefined
  },
  remove: string,
  update: T,
  change: {
    items: T[]
  } 
};
export interface DropdownUIComponent<T extends DropdownItem> extends UIComponent {
  events: Subscribable<DropdownEvents<T>>;
  setItems: (items: T[]) => void;
}

export function createDropdown<T extends DropdownItem>(
    id: string, 
    items: T[], 
    createItemFn: (() => T | undefined) | undefined
  ): DropdownUIComponent<T> {
  const mgr: ItemManager<T> = new ItemManager<T>(items);
  const emitter = new Emitter<DropdownEvents<T>>();

  const wrapper = document.createElement("div");
  wrapper.innerHTML = template;
  const addButton = wrapper.querySelector('.add-button')! as HTMLElement;
  const removeButton = wrapper.querySelector('.remove-button')! as HTMLElement;
  const select = wrapper.querySelector('select')! as HTMLSelectElement;
  const selectTrigger = wrapper.querySelector('.trigger')! as HTMLElement;
  const editInput = wrapper.querySelector('.edit-input')! as HTMLInputElement;
  select.id = `id-${id}`;

  function createOption(t: DropdownItem) {
    const option = document.createElement("option");
    option.text = t.name;
    option.value = t.id;
    return option;
  }

  function getOption(id: string) {
    const node = select.querySelector(`option[value="${id}"]`);
    return node ? node as HTMLOptionElement : undefined;
  }

  function setItems(items: T[]) {
    const selectedValue = select.value;
    select.innerHTML = "";
    mgr.clear();
    mgr.addAll(items);
    for (const item of mgr.items) {
     select.appendChild(createOption(item));
    }
    select.value = selectedValue;
  }

  // Select handler

  select.addEventListener("change", () => {
    const index = mgr.items.findIndex((i) => (i.id === select.value));
    if (index >= 0) {
      emitter.emit("select", {index, item: mgr.itemAt(index)});
    }
  });

  // Rename

  selectTrigger.addEventListener("click", () => {
    selectTrigger.style.display = "none";
    editInput.style.display = "block";
    const selectedItem = mgr.item(select.value);
    editInput.value = selectedItem?.name ?? "";
    const blurListener = (e: Event) => {
      if (e.target !== editInput) {
        const newValue = {...mgr.item(select.value)!};
        newValue.name = editInput.value;
        mgr.update(newValue);
        const opt = getOption(select.value);
        if (opt) {
          opt!.text = editInput.value;
        }
        selectTrigger.style.display = "block";
        editInput.style.display = "none";
        emitter.emit("update", newValue);
        emitter.emit("change", { items: mgr.items.concat() });
        document.removeEventListener("mousedown", blurListener);
      }
    };
    document.addEventListener("mousedown", blurListener);
  });

  // Add handler

  if (createItemFn) {
    addButton.addEventListener('click', () => {
      const newItem = createItemFn();
      if (newItem) {
        select.appendChild(createOption(newItem));
        mgr.add(newItem);
        select.value = newItem.id;
        emitter.emit("change", { items: mgr.items.concat() })
      }
    });
  } else {
    addButton.style.display = "none";
  }
  
  // Remove handler

  removeButton.addEventListener('click', () => {
    const removeId = select.value;
    const nextIdx = mgr.remove(removeId);
    if (nextIdx < 0) {
      return;
    }
    const nextValue = mgr.itemAt(nextIdx)!;
    const opt = getOption(select.value);
    if (opt) {
      select.removeChild(opt);
      select.value = nextValue.id;
    }
    emitter.emit("remove", removeId);
    emitter.emit("select", { index: nextIdx, item: mgr.itemAt(nextIdx)});
  });

  // Add options
  for (const item of mgr.items) {
     select.appendChild(createOption(item));
  }
  
  return {
    element: wrapper,
    update: () => {},
    setItems,
    events: emitter
  }
}

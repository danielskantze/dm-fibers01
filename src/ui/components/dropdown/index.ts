import { Emitter, type Subscribable } from '../../../util/events';
import type { UIComponent } from '../types';
import './dropdown.css';

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
  change: {
    items: T[]
  } 
};
export interface DropdownUIComponent<T extends DropdownItem> extends UIComponent {
  events: Subscribable<DropdownEvents<T>>
}

export function createDropdown<T extends DropdownItem>(id: string, items: T[], createItemFn: () => T): DropdownUIComponent<T> {
  const container = document.createElement("div");
  const mgr: ItemManager<T> = new ItemManager<T>(items);
  const emitter = new Emitter<DropdownEvents<T>>();
  container.classList.add("dropdown");
  const addButton = document.createElement("button");
  const removeButton = document.createElement("button");
  const selectWrapper = document.createElement("div");
  const select = document.createElement("select");
  const selectTrigger = document.createElement("div");
  const editInput = document.createElement("input");
  selectTrigger.classList.add("trigger");
  select.id = `id-${id}`;
  selectWrapper.classList.add("select-wrapper");
  editInput.classList.add("edit-input");

  function createOption(t: DropdownItem) {
    const option = document.createElement("option");
    option.text = t.name;
    option.value = t.id;
    return option;
  }

  function getOption(id: string): HTMLOptionElement | undefined {
    const opts = Array.from(select.childNodes) as HTMLOptionElement[];
    return opts.find((o) => (o.value === id));
  }
  // Select handler

  select.addEventListener("change", () => {
    const index = mgr.items.findIndex((i) => (i.id === select.value));
    if (index >= 0) {
      emitter.emit("select", {index, item: mgr.itemAt(index)});
    }
  });

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
        emitter.emit("change", { items: mgr.items.concat() });
        document.removeEventListener("mousedown", blurListener);
      }
    };
    document.addEventListener("mousedown", blurListener);
  });

  // Add handler

  addButton.textContent = "＋";
  addButton.addEventListener('click', () => {
    const newItem = createItemFn();
    select.appendChild(createOption(newItem));
    mgr.add(newItem);
    select.value = newItem.id;
    emitter.emit("change", { items: mgr.items.concat() })
  });
  container.appendChild(addButton);

  // Remove handler

  removeButton.textContent = "－";
  removeButton.addEventListener('click', () => {
    const nextIdx = mgr.remove(select.value);
    if (nextIdx < 0) {
      return;
    }
    const nextValue = mgr.itemAt(nextIdx)!;
    const opt = getOption(select.value);
    if (opt) {
      select.removeChild(opt);
      select.value = nextValue.id;
    }
    emitter.emit("select", { index: nextIdx, item: mgr.itemAt(nextIdx)});
  });
  container.appendChild(removeButton);

  // Add options

  for (const item of mgr.items) {
    select.appendChild(createOption(item));
  }
  container.appendChild(selectWrapper);
  selectWrapper.appendChild(select);
  selectWrapper.appendChild(selectTrigger);
  selectWrapper.appendChild(editInput);
  return {
    element: container,
    update: () => {},
    events: emitter
  }
}

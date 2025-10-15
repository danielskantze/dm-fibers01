import './dropdown.css';

type DropDownArguments<T> = {
  id: string,
  items: T[],
  optionId: (item: T) => string,
  optionTitle: (item: T) => string,
  onSelect: (item: T, index: number) => void,
  onAdd?: () => T,
  onRemove?: (index: number, item: T) => boolean,
  onUpdate?: (items: T[]) => void
}

export function createDropdown<T>(
  args: DropDownArguments<T>
): HTMLDivElement {
  const { id, optionId, optionTitle, onSelect, onAdd, onRemove, onUpdate } = args;
  const items = [...args.items];
  console.log(items);
  const container = document.createElement("div");
  container.classList.add("dropdown");
  const addButton = document.createElement("button");
  const removeButton = document.createElement("button");
  const selectWrapper = document.createElement("div");
  const select = document.createElement("select");
  select.id = `id-${id}`;
  selectWrapper.classList.add("select-wrapper");

  function createOption(t: T) {
    const option = document.createElement("option");
    option.text = optionTitle(t);
    option.value = optionId(t);
    return option;
  }

  // Select handler

  select.addEventListener("change", (e: Event) => {
    const elmt = (e.target as HTMLSelectElement);
    console.log(elmt.value, select.value);
    const index = items.findIndex((i) => (optionId(i) === select.value));
    if (index >= 0) {
      onSelect(items[index], index);
    }
  });

  // Add handler

  if (onAdd) {
    addButton.textContent = "＋";
    addButton.addEventListener('click', () => {
      const newItem = onAdd();
      select.appendChild(createOption(newItem));
      items.push(newItem);
      select.value = optionId(newItem);
      if (onUpdate) {
        onUpdate(items);
      }
    });
    container.appendChild(addButton);
  }

  // Remove handler

  if (onRemove) {
    removeButton.textContent = "－";
    removeButton.addEventListener('click', () => {
      let index = items.findIndex((o) => (optionId(o) === select.value));
      if (index < 0) {
        return;
      }
      if (!onRemove(index, items[index])) {
        return;
      }
      let opt: HTMLOptionElement | null = null;
      select.childNodes.forEach((o: ChildNode) => {
        if ((o as HTMLOptionElement).value === select.value) {
          opt = o as HTMLOptionElement;
        }
      });
      if (opt) {
        select.removeChild(opt);
      }
      items.splice(index, 1);
      const newIndex = Math.max(0, index - 1);
      select.value = optionId(items[newIndex]);
      if (onUpdate) {
        onUpdate(items);
      }
      onSelect(items[newIndex], newIndex);
    });
    container.appendChild(removeButton);
  }

  // Add options

  for (const item of items) {
    select.appendChild(createOption(item));
  }
  container.appendChild(selectWrapper);
  selectWrapper.appendChild(select);
  return container;
}

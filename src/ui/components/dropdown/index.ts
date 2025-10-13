import './dropdown.css';

export type DropdownItem = {
  title: string
};

export function createDropdown<T extends DropdownItem>(
  id: string, 
  dropdownItems: T[], 
  onSelect: (item: T, index: number) => void,
  onAdd?: () => T,
  onRemove?: (item: T, index: number) => void,
): HTMLDivElement {
    const items = [...dropdownItems];
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
      option.text = t.title;
      option.id = t.title;
      return option;
    }
    if (onAdd) {
      addButton.textContent = "＋";
      addButton.addEventListener('click', () => {
        const newItem = onAdd();
        select.appendChild(createOption(newItem));
        items.push(newItem);
        select.value = newItem.title;
      });
      container.appendChild(addButton);
    }
    if (onRemove) {
      removeButton.textContent = "－";
      removeButton.addEventListener('click', () => {
        const index = items.findIndex((i) => (i.title === select.value));
        if (index < 0) {
          return;
        }
        onRemove(items[index], index);
        let opt: HTMLOptionElement | null = null;
        select.childNodes.forEach((o: ChildNode) => {
          if ((o as HTMLOptionElement).id === select.value) {
            opt = o as HTMLOptionElement;
          }
        });
        if (opt) {
          select.removeChild(opt);
        }
        items.splice(index, 1);
        select.value = items[Math.max(0, index - 1)].title;
      });
      container.appendChild(removeButton);
    }
    for (const item of items) {
      select.appendChild(createOption(item));
    }
    container.appendChild(selectWrapper);
    selectWrapper.appendChild(select);
    return container;
}

import type { BlobItemData, BlobItemMetadata, BlobStore } from "../../service/storage";
import {
  createDropdown,
  type DropdownUIComponent,
  type DropdownItem,
} from "../components/dropdown";
import { generateId } from "../util/id";

function asyncReadFile(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = e => {
      reject(e);
    };
    reader.onload = () => {
      resolve(reader.result as ArrayBuffer);
    };
    reader.readAsArrayBuffer(file);
  });
}

export function createFileSelector(
  store: BlobStore,
  id: string,
  type: string,
  onSelect: (item: BlobItemData | undefined) => void = () => {}
): DropdownUIComponent {
  let items: BlobItemMetadata[] = [];
  const toDropdownItem = (p: BlobItemMetadata): DropdownItem => ({
    id: p.id,
    name: p.name,
  });

  const dropdown = createDropdown({
    id,
    items: [],
  });

  const hiddenInput = document.createElement("input");
  hiddenInput.type = "file";
  hiddenInput.style.display = "none";

  document.body.appendChild(hiddenInput);

  const updateItems = () => {
    return store.list(type).then(newItems => {
      items = newItems;
      dropdown.setItems(items.map(toDropdownItem));
    });
  };

  const onSelectEvent = ({ id }: { id: string | undefined }) => {
    if (id) {
      store.get(id).then(onSelect);
    } else {
      onSelect(undefined);
    }
  };

  const onAdd = () => {
    hiddenInput.click();
  };

  const onRename = ({ id, newName }: { id: string; newName: string }) => {
    const item = items.find(i => i.id === id);
    if (item) {
      item.name = newName;
      store.update(item).then(updateItems);
    }
  };

  const onDelete = ({ id }: { id: string }) => {
    store.remove(id).then(updateItems);
  };

  const onFileSelected = () => {
    let promises: Promise<void>[] = [];
    for (const file of hiddenInput!.files ?? []) {
      promises.push(
        asyncReadFile(file).then((buffer: ArrayBuffer) =>
          store.add({
            data: buffer,
            id: generateId(),
            type,
            name: file.name,
          })
        )
      );
    }
    Promise.all(promises).then(updateItems);
  };
  hiddenInput.addEventListener("change", onFileSelected);

  dropdown.events.subscribe("select", onSelectEvent);
  dropdown.events.subscribe("add", onAdd);
  dropdown.events.subscribe("rename", onRename);
  dropdown.events.subscribe("delete", onDelete);
  updateItems();

  const originalDestroy = dropdown.destroy;
  dropdown.destroy = () => {
    hiddenInput.removeEventListener("change", onFileSelected);
    dropdown.events.unsubscribe("select", onSelectEvent);
    dropdown.events.unsubscribe("add", onAdd);
    dropdown.events.unsubscribe("rename", onRename);
    dropdown.events.unsubscribe("delete", onDelete);
    originalDestroy!();
  };

  return dropdown;
}

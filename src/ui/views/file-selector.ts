import type { BlobItemMetadata, BlobStore } from "../../service/storage";
import { createDropdown } from "../components/dropdown";
import type { UIComponent } from "../components/types";
import { generateId } from "../util/id";

function asyncReadFile(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = (e) => {
      reject(e);
    };
    reader.onload = () => {
      resolve(reader.result as ArrayBuffer);
    };
    reader.readAsArrayBuffer(file);
  });
}

export function createFileSelector(store: BlobStore, id: string, type: string): UIComponent {
  const hiddenInput = document.createElement("input");
  hiddenInput.type = "file";
  hiddenInput.style.display = "none";

  document.body.appendChild(hiddenInput);

  const onSelect = (id: string) => {
    store.get(id)
      .then((item) => {
        console.log(item);
      });
  }
  const onAdd = () => {
    hiddenInput.click();
    return undefined;
  };
  const updateItems = () => {
    return store.list(type)
      .then((items) => {
        dropdown.setItems(items);
      });
  }
  const onRemove = (id: string) => {
    store.remove(id).then(updateItems);
  };
  const onUpdate = (item: BlobItemMetadata) => {
    store.update(item).then(updateItems);
  };
  const onFileSelected = () => {
    let promises: Promise<void>[] = [];
    for (const file of hiddenInput!.files ?? []) {
      promises.push(
        asyncReadFile(file)
        .then((buffer: ArrayBuffer) => (
          store.add({
            data: buffer,
            id: generateId(),
            type,
            name: file.name
          })
        ))
      );
    }
    Promise.all(promises)
      .then(() => (store.list("audio")))
      .then(updateItems);
  }
  hiddenInput.addEventListener("change", onFileSelected);

  const dropdown = createDropdown<BlobItemMetadata>(id, [], onAdd);
  store.list(type)
    .then((items: BlobItemMetadata[]) => {
      dropdown.setItems(items);
    });
  dropdown.events.subscribe("select", ({ item }) => {
    if (item) {
      onSelect(item.id);
    }
  });
  dropdown.events.subscribe("remove", onRemove);
  dropdown.events.subscribe("update", onUpdate);  
  updateItems();
  return dropdown;
}
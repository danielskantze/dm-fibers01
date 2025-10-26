import type { ParameterPreset, ParameterRegistry } from "../../service/parameters";
import { createDropdown, type DropdownUIComponent } from "../components/dropdown";
import { generateId } from "../util/id";

export function createPresetControls(
  select: (item: ParameterPreset) => void,
  load: () => ParameterPreset[],
  save: (items: ParameterPreset[]) => void,
  params: ParameterRegistry
): DropdownUIComponent<ParameterPreset> {
  const dropdown = createDropdown<ParameterPreset>("presets", load(), () =>
    params.toPreset(generateId(), new Date().toLocaleString())
  );

  const onSelect = ({ item }: { item: ParameterPreset | undefined }) => {
    if (item) {
      select(item);
    }
  };
  dropdown.events.subscribe("select", onSelect);

  const onRemove = (removeId: string) => {
    save(load().filter(i => i.id !== removeId));
  };
  dropdown.events.subscribe("remove", onRemove);

  const onChange = ({ id, items }: { id: string; items: ParameterPreset[] }) => {
    const presets = [...items];
    let idx = presets.findIndex(p => p.id === id);
    const updatedItem = params.toPreset(id, presets[idx].name);
    presets[idx] = updatedItem;
    save(presets);
  };
  dropdown.events.subscribe("change", onChange);

  const originalDestroy = dropdown.destroy;
  dropdown.destroy = () => {
    dropdown.events.unsubscribe("select", onSelect);
    dropdown.events.unsubscribe("remove", onRemove);
    dropdown.events.unsubscribe("change", onChange);
    originalDestroy!();
  };

  return dropdown;
}

import type { ParameterPreset, ParameterRegistry } from "../../service/parameters";
import { createDropdown } from "../components/dropdown";
import type { UIComponent } from "../components/types";
import { generateId } from "../util/id";

export function createPresetControls(
  select: (item: ParameterPreset) => void,
  load: () => ParameterPreset[],
  save: (items: ParameterPreset[]) => void,
  params: ParameterRegistry
): UIComponent {
  const dropdown = createDropdown<ParameterPreset>("presets", load(), () =>
    params.toPreset(generateId(), new Date().toLocaleString())
  );
  dropdown.events.subscribe("select", ({ item }) => {
    if (item) {
      select(item);
    }
  });
  dropdown.events.subscribe("remove", removeId => {
    save(load().filter(i => i.id !== removeId));
  });
  dropdown.events.subscribe("change", ({ id, items }) => {
    const presets = [...items];
    let idx = presets.findIndex(p => p.id === id);
    const updatedItem = params.toPreset(id, presets[idx].name);
    presets[idx] = updatedItem;
    save(presets);
  });
  return dropdown;
}

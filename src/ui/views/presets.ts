import type { ParameterPreset, ParameterRegistry } from "../../service/parameters";
import {
  createDropdown,
  type DropdownUIComponent,
  type DropdownItem,
} from "../components/dropdown";
import { generateId } from "../util/id";

export function createPresetControls(
  select: (item: ParameterPreset) => void,
  load: () => ParameterPreset[],
  save: (items: ParameterPreset[]) => void,
  params: ParameterRegistry
): DropdownUIComponent {
  let presets = load();

  const toDropdownItem = (p: ParameterPreset): DropdownItem => ({
    id: p.id,
    name: p.name,
  });

  const dropdown = createDropdown({
    id: "presets",
    items: presets.map(toDropdownItem),
    saveButtonAlwaysVisible: true,
  });

  const onSelect = ({ id }: { id: string | undefined }) => {
    const preset = presets.find(p => p.id === id);
    if (preset) {
      select(preset);
    }
  };

  const onAdd = ({ name }: { name: string }) => {
    const newPreset = params.toPreset(generateId(), name);
    presets = [...presets, newPreset];
    save(presets);

    dropdown.setItems(presets.map(toDropdownItem), newPreset.id);
    select(newPreset);
  };

  const onSave = ({ id, newName }: { id: string; newName: string }) => {
    const preset = presets.find(p => p.id === id);
    if (preset) {
      preset.name = newName;
      const currentValues = params.toPreset(preset.id, preset.name);
      preset.data = currentValues.data;
      save(presets);
      dropdown.setItems(presets.map(toDropdownItem), id);
    }
  };

  const onDelete = ({ id }: { id: string }) => {
    const index = presets.findIndex(p => p.id === id);
    if (index === -1) return;

    presets = presets.filter(p => p.id !== id);
    save(presets);

    const newIndex = Math.min(index, presets.length - 1);
    const newSelected = presets[newIndex];

    dropdown.setItems(presets.map(toDropdownItem), newSelected.id);
    if (newSelected) {
      select(newSelected);
    }
  };

  dropdown.events.subscribe("select", onSelect);
  dropdown.events.subscribe("add", onAdd);
  dropdown.events.subscribe("save", onSave);
  dropdown.events.subscribe("delete", onDelete);

  const originalDestroy = dropdown.destroy;
  dropdown.destroy = () => {
    dropdown.events.unsubscribe("select", onSelect);
    dropdown.events.unsubscribe("add", onAdd);
    dropdown.events.unsubscribe("save", onSave);
    dropdown.events.unsubscribe("delete", onDelete);
    originalDestroy!();
  };

  return dropdown;
}

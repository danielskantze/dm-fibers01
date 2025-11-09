import type { PublicAudioStatsCollector } from "../../../service/audio/audio-stats";
import type { Parameter } from "../../../service/parameters";
import type { ModifierType } from "../../../service/parameters/modifiers";
import { AudioAnalysisModifier } from "../../../service/parameters/modifiers/audio-analysis-modifier";
import { LFOModifier } from "../../../service/parameters/modifiers/lfo-modifier";
import type {
  AnyModifierConfig,
  BlendMode,
} from "../../../service/parameters/modifiers/types";
import { attachAccessoryView, removeAccessoryView } from "../decorators/accessory-view";
import type { AccessoryOwnerComponent } from "../types";
import { createModifiers, type ModifiersComponent } from "./index";

export const blendModeEnumLabelMap: { [K in BlendMode]: string } = {
  add: "Add",
  multiply: "Mult",
  overwrite: "Set",
};

export function manageModifiersFor(
  owner: AccessoryOwnerComponent,
  param: Parameter,
  audioAnalyzer: PublicAudioStatsCollector
): () => void {
  let component: ModifiersComponent | null = null;
  const subscriptions: (() => void)[] = [];

  const onAdd = (modifierType: ModifierType) => {
    const { type, domain } = param.data;
    switch (modifierType) {
      case "lfo":
        param.addModifier(new LFOModifier(undefined, type ?? "float", domain, {}));
        break;
      case "audio":
        param.addModifier(
          new AudioAnalysisModifier(undefined, type ?? "float", domain, audioAnalyzer, {})
        );
        break;
    }
  };

  const onUpdate = (id: string, config: AnyModifierConfig) => {
    param.updateModifier(id, config);
  };

  const onRemove = (id: string) => {
    param.removeModifier(id);
  };

  const initSub = param.events.subscribe("modifierInit", ({ modifiers }) => {
    if (component) {
      // Should not happen with sticky event, but good practice
      removeAccessoryView(owner);
      component.destroy?.();
    }

    component = createModifiers({
      modifiers,
      onAdd,
      onUpdate,
      onRemove,
    });
    attachAccessoryView(owner, component);

    const updateSub = param.events.subscribe("modifierUpdate", ({ id, type, config }) => {
      if (!component) return;
      switch (type) {
        case "add":
          component.addModifier(id, config);
          break;
        case "change":
          component.updateModifier(id, config);
          break;
        case "delete":
          component.removeModifier(id);
          break;
      }
    });
    subscriptions.push(updateSub);
  });
  subscriptions.push(initSub);

  return () => {
    removeAccessoryView(owner);
    subscriptions.forEach(unsub => unsub());
    component?.destroy?.();
  };
}

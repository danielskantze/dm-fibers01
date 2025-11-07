### Project Context Summary

**Creative Goals (The "Why"):**
I am building a generative 3D particle art system in WebGL that functions as a "music video." The core goal is to make the artwork feel **alive** and **deeply connected to music**. It should dynamically reflect:

1.  **Perceptual Properties:** Direct reactions, like a kick drum causing a particle burst.
2.  **Music State/Section:** Different visuals for a slow intro versus an intense chorus.
3.  **Mood:** Emotional music using warm tones, industrial music using cold tones.
4.  **Variation:** It must be a dynamic, evolving piece, not a static animated loop.

**Technical Implementation (The "How"):**
To achieve this, parameters are built around a `ManagedParameter` class.

- **Core Concept:** A `ManagedParameter` has a `baseValue` (set by UI or presets/sections) and a `finalValue` (used by the renderer).
- **Modifier Stack:** The `finalValue` is calculated by applying a stack of `IModifier` objects on top of the `baseValue`. This allows for layering perceptual, mood, and automation logic.
- **Key Interfaces:**
  - **`ManagedParameter`:** Holds the `baseValue` and `finalValue`. It has methods to `add`, `update`, `remove`, and `clear` modifiers. It also features an `events` property to subscribe to modifier changes (e.g., `modifierInit`, `modifierAdd`).
  - **`IModifier`:** The pluggable logic interface. Implementations include `LFO`, `AudioFeature` (for perceptual mapping), `MIDI`, and `Envelope`.
- **Orchestration:** A `ParameterService` manages loading presets (which define the `baseValue`s for sections/moods) and handles transitions between them.

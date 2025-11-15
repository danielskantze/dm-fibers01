# MODIFIER IDEAS

NOTE: See [UI](./UI.md) for details about modifiers and parameters.

In this document we collect ideas about which modifiers to consider for addition to the system.

## Simple modifiers

Can be implemented without large refactoring or new development

- [ ] Transfer (log, exp, pow etc)
- [ ] Adapter (vec3 > 3 scalar slots). Use for palette
- [ ] DomainMapper (good for sections)
- [ ] LatchModifier holds the last value for events (useful for midi)
- [ ] Binary
- [ ] VectorRotator
- [ ] LFO for vectors (component wise support)
- [ ] Quantizer
- [x] Smoother (Chroma style smoothing, speed param)
- [x] Scaler / offset (just a basemod)
- [x] LFO for ints (particles)
- [x] Modifier for audio stats (works as lfo, feature value is y, consider supporting smoothing)
- [x] LFO with other curves (square, triangle)

## Complex modifiers

Required architectural changes or substantial new development

- [ ] Modifier group (for easy bypass of multiple modifiers / collapse)
- [ ] Switch. Select between different modifier chains based on frame. Relies on modifier groups. We may need to compute all chains and transition between them. Otherwise we may risk choppiness.

# ONGOING:

## Implement new architecture

# TODO:

ParameterService modifiers

- [ ] Accessory handle should show if there are modifiers or not
- [x] Text input for scalars
- [x] Implement new architecture
- [x] Implement LFOModifier (no further explanation needed)
- [ ] Implement ChasedValueModifier (gradually transition a value into the target value, simplest is Chroma style exp v = tv _ 0.01 + v _ 0.99)
- [x] Update data format and presets

Research a way of automating preset transitions (for novelty / state changes)

- Formulate requirements (different levels? slow fundamental ones, quick transient one. Is this a state machine or a stack of layers or both?)
- Consider chaining presets with a state machine (and visualising)
- Formulate fundamental needs automate single parameters - respond to audio's perceptual qualities vs create variation through "theme changes" (a.k.a group of parameter changes and ranges)

Audio:

- Research spectral flux for novelty detection

Figure out a way to connect number of particles to sound intensity

Experience:

- Support palette rotation

Simulation:

- Support max number of particles being created per frame being spawned

Refactoring:

- Go through all random types.ts files - are they needed?
- Improve uniform send (base this on Uniform type, check type, pick location and so on)
- Check how non-uniform (or virtual uniforms) such as particles are sent to shader

Math

- Add smoothing and damping functions

Figure out how relative parameters should work

Simple add music (hook up to audio features)

- Sync beats with stroke noise x/y (each kick will pulse these)
- Also pulsate stroke radius (maybe for a new section?)
- Possibly tune palette x/y too
- Experiment with syncing particle start time too (high intensity - particle restarts immediately)
- And of course, test controlling number of particles (possibly relate to radius)

Hook up midi parameters

Hook up music timeline file

Migrate all vectors and math classes to use Float32Arrays instead of number[]
Handle outdated parameters (wrong version)
3D support (each particle has Z component)
Group parameters of different types (e.g. bloom)
Consider adding LFOs
Support brightness, contrast and color temperature post controls

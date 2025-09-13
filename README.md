# Fibers01

WebGL2-based particle system that renders slowly growing fibers. 

## Getting started

### Install:
`npm i`

### Start development server:
`npm run dev`

## Idea

Use a series of rendering stages to manage both particles, their state (and updates) and rendering in shaders. 

### Nomenclature

- Flip-flop texture: Using two textures to maintain to support reading from the last state while writing the new state to an output texture. 

### Stages

- **simulate** - Store all particles in textures. Read state from last textures, update each particle and write to a new textures, then swap read/write texture. A particle has a bunch of properties such as position, lifetime etc. At each position there is a vector field that determines a particle's angle each update (speed is constant). 
- **accumulate** - Reads properties from textures from simulate step and draws a GL_POINT at each particle coordinate. Supports MSAA for better quality. Also writes a texture with a timestamp for each drawn particle at its position. 
- **post** - Reads accumulated texture, fades pixels to black based on the time that has elapsed since they were last updated (timestamp). 
- **display** - Displays textures from post
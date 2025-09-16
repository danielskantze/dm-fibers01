# Fibers 01 - Implementation idea

The purpose of this document is to describe the implementation of the Fibers 01 application. For details on what it does, please refer to [DESC.md](DESC.md). 

## Rendering pipeline

### Buffers

A buffer is typically stored in a texture

- Particle buffer(s): Particles are stored in texture (e.g. a one-dimensional texture). Depending on how many properties we need for a particle, the properties may need to be shareded into multiple buffers. Ideally use RGBA32F for internalformat so we can store as much data as possible in each buffer. 

- Output buffer: The screen or an offscreen buffer

### Rendering

- Update fragment shader

### Shaders

- Particles shader: A fragment shader that updates the particle states. 
- Particles to render shader: A vertex shader that reads the particle states and draws a quad for each particle where the coordinates are specified by the particle coordinates. Particle properties are sent to the render shader as varying. 
- Render shader: Compute the color for the pixel based on the properties sent. 

## Project setup


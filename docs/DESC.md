# Fibers 01 - Concept description

This document describes the concept of the Fibers 01. Implementation details are specifically left out of this document (see [IMPLEMENTATION.md](IMPLEMENTATION.md))

## Introduction

Fibers01 is a digtial art project that renders a fiber-like pattern - budles of flowing thin pen strokes in colors picked from a smooth palette. The rendering is fast so that the pattern either can evolve gradually but also render quickly offscreen.

## Requirements

- Maintain 60 fps during rendering
- Render in high resolution: at least 2048x2048
- Complete an offline render in < 2 seconds on an average desktop
- Simulate at least 400 000 particles concurrently. Each particle's path over its lifespan creates a "stroke".
- Each stroke should have a length of at least 12.5% of the pattern size (e.g., 256 pixels for a 2048 pixel wide pattern).

## Particle system

The system can be conceptualized as thousands of "pens" (particles) drawing strokes on a canvas simultaneously. Each particle moves independently, and its path over its lifespan forms a single, continuous stroke. The collective result of all these strokes creates the final fiber-like pattern.

### The particle

Each particle has the following properties:

- position ([x, y])
- age
- lifespan
- speed
- color ([r, g, b, a])

#### Initializing

- position: Randomized within the output buffer's bounds
- age: 0
- lifespan: Randomize (typically less than 256 or 12.5% of the output buffer's bounds)
- speed: 1 (let all pixels have the same speed for now)
- color: Randomize from a smooth palette function

#### Updating

For each position there is an angle in a vector field built from 2d simplex noise

- if the particle's age is <=lifespan:
  - position: Compute a directional vector from the angle at the particle's position in the vector field. Multiply the vector with the particle's speed. Add this to the particle's current position.
  - age: Increase the age with 1 for each render.
- if the particle's age is > lifespan:
  - Initialize the particle

#### Rendering

Each particle is rendered to a pixel.

The pixel's color is the particle color with the alpha channel dependent on the particle's age / lifespan so that the multiplier is 0 at the start and at the end and 1 in the middle.

Here is an example (assume p is the particle):

`vec4 color = vec4(p.color.rgb, p.color.a * 0.5 * (1.0 + sin(PI * 2.0 * (p.age / p.lifetime - 0.25))))`

### The Scene

The overall idea for the particle system is to draw fibers (by stamping / materializing a particle mulitple times in a trail). The fibers gradually fade in and out at the start and end of their life. To end up with a dynamic scene that can play for an infinite amount of time and still look interesting I have introdcued a trail decay function.

So there are two systems at play. The particle alpha that will vary when each particle is materialized and the trail fading. The trails are stored in a flat texture. To still maintain a way of controlled fading is to use an additional texture that keeps track of each time a pixel was written to the screen. By using that, the current lifetime of a trail pixel can be established and the fade determined.

Properties:

- Bounds (width, height)
- Frames to render (number of frames to render until the scene is completed)
- Background color
- Number of particles
- Updates per frame (to increase the number of pixels rendered per frame, we may update and draw multiple times at each frame)

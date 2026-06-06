# Three.js Betta Aquarium Design

## Goal

Mossling v1 pivots from a 2D PixiJS aquarium to a model-first Three.js aquarium. The core experience remains a cozy fullscreen-friendly live aquarium, but the betta should be a real 3D model rather than a procedural 2D drawing.

## Decision

Use Three.js for rendering and load the downloaded Sketchfab betta model:

- Source file: `/home/yusuf/Downloads/betta_mahachai.glb`
- App asset path: `public/models/betta-mahachai/betta-mahachai.glb`
- Model: “Betta Mahachai” by Maruk (@maruk.xyz) on Sketchfab
- License: CC BY 4.0

The implementation must include attribution in README and, preferably, in a small non-intrusive app credit area.

## Product Scope

The first Three.js version focuses on one polished scene:

- One imported 3D betta model.
- Procedural 3D aquarium tank.
- Water surface/volume impression.
- Sand or gravel substrate.
- Simple procedural plants.
- Rising bubble particles.
- Soft cozy lighting.
- Seed input and random generation.
- Copyable scene link.
- Fullscreen live mode.
- Hideable UI overlay.

Out of scope for this version:

- Object editor.
- Multiple fish models.
- Multiple vessel types.
- Real physics or fluid simulation.
- Video export.
- Pet-care mechanics.
- A full asset-management system.

## Current Codebase Impact

The existing PixiJS implementation should be removed rather than adapted:

- Remove `pixi.js` dependency.
- Remove PixiJS-specific canvas component.
- Remove PixiJS scene/entity files.
- Replace with Three.js scene modules.
- Keep the seed/config idea, but make config renderer-neutral or Three.js-oriented.

This is a clean renderer cutover. Do not keep PixiJS fallback code.

## User Experience

The app opens directly into a 3D aquarium scene. The UI remains small and ambient:

- Seed input.
- Apply seed.
- Randomize seed.
- Copy link.
- Fullscreen.
- Hide UI / Show UI.

The scene should feel like a relaxing background:

- The camera frames the tank at a gentle three-quarter angle or straight-on perspective with depth.
- The betta swims slowly along a looping path.
- The betta subtly bobs and turns so the model feels alive.
- Plants sway minimally.
- Bubbles rise.
- Lighting is soft, blue-green, and cozy.

Interactions stay secondary. Pointer interaction is optional for this revision and should not block the v1 cutover.

## Technical Architecture

Svelte owns the app shell and controls. Three.js owns rendering and animation.

Proposed modules:

- `App.svelte`: seed state, controls, fullscreen, copy link, hide/show UI.
- `ThreeAquariumCanvas.svelte`: Three.js lifecycle bridge: mount renderer canvas, create scene, resize, animate, dispose.
- `scene/seed.ts`: seed normalization and deterministic PRNG helpers.
- `scene/config.ts`: seed to aquarium config.
- `scene/types.ts`: config and runtime types.
- `scene/three/aquarium.ts`: scene assembly and update loop.
- `scene/three/model-loader.ts`: load GLB betta model with `GLTFLoader`.
- `scene/three/environment.ts`: tank, water, substrate, plants, bubbles, lights.
- `scene/three/betta.ts`: scale/orient imported model and animate swim transforms.

Data flow:

```text
seed string -> normalized seed -> AquariumConfig -> Three.js scene -> render loop
```

The model file path should be stable and explicit:

```text
/models/betta-mahachai/betta-mahachai.glb
```

## Three.js Rendering Direction

Use the imported betta model as the visual focus. Build the rest procedurally with Three.js primitives and materials:

- Tank: transparent `BoxGeometry` or line/edge frame with glass-like material.
- Water: translucent box or plane with blue-green material.
- Substrate: shallow box/plane plus small pebble spheres.
- Plants: grouped cylinders/curves/leaves using simple geometries.
- Bubbles: small translucent spheres moving upward.
- Lighting: ambient light, soft directional/key light, optional point/fill light.
- Camera: perspective camera looking at the tank, resized with viewport.

The first version should prefer stable, understandable Three.js code over advanced shaders. If water shimmer is added, keep it simple with material opacity/color animation or a subtle moving light.

## Betta Model Handling

Implementation should:

- Copy the local GLB into `public/models/betta-mahachai/betta-mahachai.glb`.
- Load through `GLTFLoader` from `three/examples/jsm/loaders/GLTFLoader.js`.
- Traverse the loaded scene to enable shadows or adjust materials if needed.
- Fit the model into the tank by applying a known scale and orientation.
- Animate the loaded model group along a slow seeded swim path.
- If embedded animations exist, play the first suitable clip with `AnimationMixer`; otherwise use transform-only animation.
- Show a calm fallback if the model fails to load.

## Seeded Configuration

Seed should influence scene variation without requiring an editor:

- Plant count and positions.
- Bubble count and positions.
- Water tint.
- Substrate tone.
- Light warmth/intensity.
- Betta swim phase and path amplitude.

The same seed should produce the same config. Model geometry stays the same.

## Error Handling

- If Three.js renderer creation fails, show an aquarium startup fallback.
- If the betta model fails to load, show a fallback panel explaining that the model asset is missing or failed.
- Empty seed input normalizes to a generated seed.
- Resize updates camera aspect and renderer size.
- Renderer, geometries, materials, textures, mixers, and event listeners must be disposed on component teardown.

## Testing Strategy

Keep testing light and functional.

Automated tests should cover seed/config behavior only:

- Same seed returns the same config.
- Different seeds usually produce different configs.
- Generated ranges stay valid.
- Model path in config is stable.

Manual QA should cover:

- `pnpm dev` starts through `vp dev`.
- 3D aquarium renders.
- Betta model appears.
- Betta moves slowly.
- Randomize changes procedural environment.
- Re-entering a seed recreates the same environment.
- Copy link writes a URL with `?seed=`.
- Fullscreen works.
- Hide UI / Show UI works.
- Resize keeps the tank framed.
- `pnpm build` succeeds.
- Fallow reports no dead PixiJS code.

## Documentation Requirements

README must document:

- Three.js renderer.
- The current v1 scope.
- Model attribution and license.
- Asset location.
- Commands.

Attribution text:

> “Betta Mahachai” by Maruk (@maruk.xyz) on Sketchfab, licensed under CC BY 4.0. Model: https://sketchfab.com/3d-models/betta-mahachai-81b3f2b3db3d4018ae6f1de55edce6e3

## Future Directions

After this cutover:

- Better plant/decor models.
- More fish models.
- Orbit/idle camera options.
- Still image export.
- Lightweight editor.
- Water shaders.
- Video export later if browser recording quality is acceptable.

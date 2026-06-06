# Ambient Betta Aquarium Design

## Goal

Mossling v1 is a seeded ambient aquarium generator: a cozy fullscreen-friendly live scene with one animated betta fish, plants, bubbles, soft water lighting, and minimal controls. It is not an editor, video exporter, or pet-care simulator in this version.

## Product Scope

The first version focuses on one polished scene type: a procedural aquarium with a betta fish and plants. Users can:

- View the aquarium as a live animated scene.
- Enter fullscreen mode for foreground/background relaxation.
- Generate a new scene from a random seed.
- Enter a seed manually.
- Copy the current seed or shareable link.
- Hide the UI overlay for an uninterrupted ambient view.

Out of scope for v1:

- Manual object editor.
- Multiple vessel types.
- Terrarium/jarrarium modes.
- Video export.
- Still wallpaper export.
- Pet-care mechanics, needs, health, or death.

## User Experience

The app opens directly into a generated aquarium. The UI should feel lightweight and avoid blocking the scene. Controls sit in a small overlay and can be hidden.

The scene should feel alive without demanding attention:

- The betta swims slowly through the tank.
- The betta occasionally changes depth, idles near plants, turns, or flares fins.
- Plants sway subtly.
- Bubbles rise from seeded positions.
- Lighting has a gentle shimmer/caustic feel.
- Pointer movement may create a tiny reaction, such as a short avoid/follow behavior, but interaction is optional and secondary.

## Technical Architecture

Svelte owns the app shell and UI. PixiJS v8 owns rendering and animation.

Proposed modules:

- `App.svelte`: page layout, seed state, fullscreen control, copy/randomize actions, hide/show UI.
- `AquariumCanvas.svelte`: PixiJS application lifecycle, canvas mount, resize handling, clean destroy.
- `scene/seed.ts`: deterministic seed normalization and pseudo-random number generation.
- `scene/aquarium.ts`: builds the scene from an `AquariumConfig`.
- `scene/config.ts`: turns a seed into deterministic configuration values.
- `scene/entities/betta.ts`: procedural betta drawing and swim animation.
- `scene/entities/plants.ts`: procedural plant clusters and sway animation.
- `scene/entities/bubbles.ts`: ambient bubble particles.

The data flow is:

```text
seed string -> normalized seed -> PRNG -> AquariumConfig -> PixiJS display objects
```

Scene generation should be deterministic. The same seed should produce the same aquarium composition.

## PixiJS Rendering Direction

Use procedural vector rendering first. Avoid an asset pipeline in v1.

Scene elements:

- Soft background gradient.
- Glass tank/vessel outline.
- Water fill and subtle overlays.
- Substrate/sand/gravel shapes.
- Plant stems/leaves using `Graphics`.
- Betta body, fins, and tail using procedural shapes.
- Bubble particles using lightweight shapes.
- Optional translucent shimmer overlays.

The implementation should keep the PixiJS scene graph understandable: separate containers for background, tank, plants, betta, particles, and UI-independent effects.

## Seeded Configuration

Seed should influence visual variety while staying within cozy constraints:

- Betta palette.
- Plant count.
- Plant height and clustering.
- Substrate tone.
- Bubble density.
- Water/background tint.
- Swim path timing offsets.

Config values should have explicit bounds so random scenes remain attractive and valid.

## Error Handling

- If PixiJS initialization fails, show a calm fallback panel with a retry action.
- Empty seed input should normalize to a generated seed.
- Invalid or awkward seed strings should be accepted as plain text and normalized safely.
- Resize should preserve composition and avoid expensive rebuild loops.
- PixiJS resources must be destroyed when the Svelte component unmounts.

## Testing Strategy

Keep testing light and functional for v1. Do not build component-by-component test coverage.

Automated checks should focus on seed/config behavior:

- Same seed returns the same `AquariumConfig`.
- Different seeds usually produce different configs.
- Generated config values stay within valid ranges.

Manual functional QA should cover:

- `pnpm dev` starts through `vp dev`.
- Scene appears and animates.
- Randomize changes the scene.
- Manual seed input regenerates deterministically.
- Copy seed/link works.
- Fullscreen works.
- Hide UI works.
- Resize keeps the scene usable.
- `pnpm build` succeeds through `vp build`.
- Pre-commit checks still run.

## Future Directions

After v1, likely next steps are:

- More scene types: terrarium, jarrarium, aquarium variants.
- Adjustable water level.
- Geckos, snails, shrimp, isopods, or additional fish.
- A lightweight editor for object placement.
- Still wallpaper export.
- Later, video export if browser recording quality is reliable enough.

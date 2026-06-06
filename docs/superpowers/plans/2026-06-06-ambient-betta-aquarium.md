# Ambient Betta Aquarium Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Mossling v1 as a seeded ambient PixiJS betta aquarium with minimal Svelte controls and fullscreen live mode.

**Architecture:** Svelte owns the page shell, seed controls, fullscreen, and UI visibility. PixiJS v8 owns rendering through a focused `AquariumCanvas.svelte` component that creates an `Application`, builds a deterministic procedural scene from `AquariumConfig`, updates animation through `app.ticker`, resizes without rebuilding every frame, and destroys cleanly.

**Tech Stack:** Svelte 5, TypeScript strictest, Vite+, PixiJS v8, Vitest via `vp test`, Fallow, Husky.

---

## File Structure

Create or modify these files:

- Modify `package.json`: add `pixi.js`, `vitest`, `test`, and include tests in `check:all`.
- Create `src/scene/types.ts`: shared scene configuration types.
- Create `src/scene/seed.ts`: seed normalization, hash, deterministic PRNG helpers.
- Create `src/scene/config.ts`: convert seed into bounded `AquariumConfig`.
- Create `src/scene/config.test.ts`: light functional tests for deterministic generation and ranges.
- Create `src/scene/aquarium.ts`: PixiJS scene assembly, resize mapping, update loop contract.
- Create `src/scene/entities/betta.ts`: procedural betta shapes and ambient swim animation.
- Create `src/scene/entities/plants.ts`: procedural plant graphics and sway animation.
- Create `src/scene/entities/bubbles.ts`: seeded bubble particles.
- Create `src/lib/AquariumCanvas.svelte`: PixiJS lifecycle bridge for Svelte.
- Modify `src/App.svelte`: replace template UI with seed/fullscreen/hide controls.
- Modify `src/app.css`: replace template styling with fullscreen cozy aquarium shell.
- Modify `README.md`: document new app behavior and commands.

---

## Task 1: Add PixiJS, Vitest, and Seeded Config Tests

**Files:**

- Modify: `package.json`
- Create: `src/scene/types.ts`
- Create: `src/scene/seed.ts`
- Create: `src/scene/config.ts`
- Test: `src/scene/config.test.ts`

- [ ] **Step 1: Install runtime and test dependencies**

Run:

```bash
pnpm add pixi.js
pnpm add -D vitest
```

Expected: `pixi.js` appears under `dependencies`, `vitest` appears under `devDependencies`, and `pnpm-lock.yaml` updates.

- [ ] **Step 2: Update package scripts**

Replace the `scripts` object in `package.json` with this exact block:

```json
{
  "dev": "vp dev",
  "build": "vp build",
  "preview": "vp preview",
  "test": "vp test run src/scene",
  "check": "vp check && svelte-check --tsconfig ./tsconfig.app.json && tsc -p tsconfig.node.json",
  "check:fallow": "fallow",
  "check:all": "pnpm test && pnpm check && pnpm check:fallow",
  "prepare": "husky"
}
```

- [ ] **Step 3: Write failing config tests**

Create `src/scene/config.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createAquariumConfig } from "./config";
import { normalizeSeed } from "./seed";

describe("aquarium config generation", () => {
  it("normalizes usable seed text", () => {
    expect(normalizeSeed("  cozy beta  ")).toBe("cozy beta");
  });

  it("generates deterministic config for the same seed", () => {
    expect(createAquariumConfig("mossling")).toEqual(createAquariumConfig("mossling"));
  });

  it("generates different visual config for different seeds", () => {
    expect(createAquariumConfig("mossling-a")).not.toEqual(createAquariumConfig("mossling-b"));
  });

  it("keeps generated values inside cozy aquarium bounds", () => {
    const config = createAquariumConfig("bounds-check");

    expect(config.seed).toBe("bounds-check");
    expect(config.tank.width).toBe(1000);
    expect(config.tank.height).toBe(700);
    expect(config.water.level).toBeGreaterThanOrEqual(0.72);
    expect(config.water.level).toBeLessThanOrEqual(0.88);
    expect(config.plants.length).toBeGreaterThanOrEqual(7);
    expect(config.plants.length).toBeLessThanOrEqual(13);
    expect(config.bubbles.length).toBeGreaterThanOrEqual(18);
    expect(config.bubbles.length).toBeLessThanOrEqual(32);

    for (const plant of config.plants) {
      expect(plant.x).toBeGreaterThanOrEqual(120);
      expect(plant.x).toBeLessThanOrEqual(880);
      expect(plant.height).toBeGreaterThanOrEqual(90);
      expect(plant.height).toBeLessThanOrEqual(240);
    }

    for (const bubble of config.bubbles) {
      expect(bubble.radius).toBeGreaterThanOrEqual(2);
      expect(bubble.radius).toBeLessThanOrEqual(7);
      expect(bubble.speed).toBeGreaterThanOrEqual(18);
      expect(bubble.speed).toBeLessThanOrEqual(56);
    }
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run:

```bash
pnpm test
```

Expected: FAIL because `src/scene/config.ts` and `src/scene/seed.ts` do not exist.

- [ ] **Step 5: Create shared scene types**

Create `src/scene/types.ts`:

```ts
export interface TankConfig {
  width: number;
  height: number;
  cornerRadius: number;
  glassTint: number;
}

export interface WaterConfig {
  level: number;
  topColor: number;
  bottomColor: number;
  overlayColor: number;
}

export interface SubstrateConfig {
  color: number;
  accentColor: number;
  height: number;
}

export interface BettaPalette {
  body: number;
  bodyAccent: number;
  fin: number;
  finAccent: number;
  eye: number;
}

export interface BettaConfig {
  palette: BettaPalette;
  baseY: number;
  swimSpeed: number;
  phase: number;
}

export interface PlantConfig {
  x: number;
  height: number;
  width: number;
  lean: number;
  color: number;
  accentColor: number;
  phase: number;
}

export interface BubbleConfig {
  x: number;
  y: number;
  radius: number;
  speed: number;
  phase: number;
  alpha: number;
}

export interface ShimmerConfig {
  color: number;
  alpha: number;
  phase: number;
}

export interface AquariumConfig {
  seed: string;
  tank: TankConfig;
  water: WaterConfig;
  substrate: SubstrateConfig;
  betta: BettaConfig;
  plants: PlantConfig[];
  bubbles: BubbleConfig[];
  shimmer: ShimmerConfig;
  background: {
    top: number;
    bottom: number;
  };
}

export interface ScenePointer {
  x: number;
  y: number;
  strength: number;
}
```

- [ ] **Step 6: Create deterministic seed helpers**

Create `src/scene/seed.ts`:

```ts
export interface Prng {
  next(): number;
  range(min: number, max: number): number;
  int(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
}

export function normalizeSeed(input: string): string {
  const trimmed = input.trim();

  if (trimmed.length > 0) {
    return trimmed;
  }

  const randomPart = Math.floor(Math.random() * 0xffffffff)
    .toString(36)
    .padStart(6, "0");

  return `mossling-${randomPart}`;
}

export function hashSeed(seed: string): number {
  let hash = 0x811c9dc5;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}

export function createPrng(seed: string): Prng {
  let state = hashSeed(seed);

  const next = (): number => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    range(min: number, max: number): number {
      return min + (max - min) * next();
    },
    int(min: number, max: number): number {
      return Math.floor(this.range(min, max + 1));
    },
    pick<T>(items: readonly T[]): T {
      if (items.length === 0) {
        throw new Error("Cannot pick from an empty list");
      }

      const item = items[this.int(0, items.length - 1)];

      if (item === undefined) {
        throw new Error("Generated pick index outside list bounds");
      }

      return item;
    },
  };
}
```

- [ ] **Step 7: Create seeded aquarium config generation**

Create `src/scene/config.ts`:

```ts
import type { AquariumConfig, BettaPalette, PlantConfig } from "./types";
import { createPrng, normalizeSeed } from "./seed";

const BETTA_PALETTES: readonly BettaPalette[] = [
  { body: 0x3157d5, bodyAccent: 0x7ab4ff, fin: 0xe94f8a, finAccent: 0xffb3cf, eye: 0x101624 },
  { body: 0xc53242, bodyAccent: 0xff8b70, fin: 0x2d73d9, finAccent: 0x91c7ff, eye: 0x101624 },
  { body: 0x5636a7, bodyAccent: 0xb78dff, fin: 0xf07a3f, finAccent: 0xffc18f, eye: 0x101624 },
  { body: 0x1f9c98, bodyAccent: 0x9ee8dd, fin: 0x5c4bd8, finAccent: 0xc3bbff, eye: 0x101624 },
];

const WATER_TOP_COLORS = [0x9bdff2, 0x8ed8de, 0xa6dcef, 0x8fc9f4] as const;
const WATER_BOTTOM_COLORS = [0x245f86, 0x1f6f73, 0x2a668e, 0x306d86] as const;
const BACKGROUND_TOP_COLORS = [0x10243a, 0x18283f, 0x132f36, 0x1e2441] as const;
const BACKGROUND_BOTTOM_COLORS = [0x07131f, 0x081a21, 0x0c1222, 0x0c1d25] as const;
const SUBSTRATE_COLORS = [0xcaa071, 0xb78e65, 0xd3b07b, 0xa9825f] as const;
const PLANT_COLORS = [0x2fa66a, 0x4eb36a, 0x2d8f78, 0x6fbf73] as const;

export function createAquariumConfig(inputSeed: string): AquariumConfig {
  const seed = normalizeSeed(inputSeed);
  const rng = createPrng(seed);
  const plantCount = rng.int(7, 13);
  const bubbleCount = rng.int(18, 32);
  const substrateHeight = rng.range(72, 104);
  const waterLevel = rng.range(0.72, 0.88);

  const plants: PlantConfig[] = Array.from({ length: plantCount }, () => {
    const color = rng.pick(PLANT_COLORS);
    const accentColor = color + 0x101000;

    return {
      x: rng.range(120, 880),
      height: rng.range(90, 240),
      width: rng.range(22, 58),
      lean: rng.range(-0.38, 0.38),
      color,
      accentColor,
      phase: rng.range(0, Math.PI * 2),
    };
  }).sort((left, right) => left.x - right.x);

  return {
    seed,
    tank: {
      width: 1000,
      height: 700,
      cornerRadius: 42,
      glassTint: 0xd8f7ff,
    },
    background: {
      top: rng.pick(BACKGROUND_TOP_COLORS),
      bottom: rng.pick(BACKGROUND_BOTTOM_COLORS),
    },
    water: {
      level: waterLevel,
      topColor: rng.pick(WATER_TOP_COLORS),
      bottomColor: rng.pick(WATER_BOTTOM_COLORS),
      overlayColor: 0xdaf8ff,
    },
    substrate: {
      color: rng.pick(SUBSTRATE_COLORS),
      accentColor: 0xf2d19a,
      height: substrateHeight,
    },
    betta: {
      palette: rng.pick(BETTA_PALETTES),
      baseY: rng.range(270, 430),
      swimSpeed: rng.range(0.55, 0.9),
      phase: rng.range(0, Math.PI * 2),
    },
    plants,
    bubbles: Array.from({ length: bubbleCount }, () => ({
      x: rng.range(110, 890),
      y: rng.range(150, 630),
      radius: rng.range(2, 7),
      speed: rng.range(18, 56),
      phase: rng.range(0, Math.PI * 2),
      alpha: rng.range(0.22, 0.62),
    })),
    shimmer: {
      color: 0xf2fdff,
      alpha: rng.range(0.06, 0.12),
      phase: rng.range(0, Math.PI * 2),
    },
  };
}
```

- [ ] **Step 8: Run tests to verify config passes**

Run:

```bash
pnpm test
```

Expected: PASS for `src/scene/config.test.ts`.

- [ ] **Step 9: Commit seeded config foundation**

Run:

```bash
git add package.json pnpm-lock.yaml src/scene/types.ts src/scene/seed.ts src/scene/config.ts src/scene/config.test.ts
git commit -m "feat: add seeded aquarium config"
```

---

## Task 2: Build Procedural PixiJS Scene Entities

**Files:**

- Create: `src/scene/entities/betta.ts`
- Create: `src/scene/entities/plants.ts`
- Create: `src/scene/entities/bubbles.ts`
- Create: `src/scene/aquarium.ts`

- [ ] **Step 1: Create procedural betta entity**

Create `src/scene/entities/betta.ts`:

```ts
import { Container, Graphics } from "pixi.js";
import type { BettaConfig, ScenePointer } from "../types";

export interface BettaEntity {
  container: Container;
  update(timeSeconds: number, deltaMS: number, pointer: ScenePointer | null): void;
}

export function createBetta(config: BettaConfig): BettaEntity {
  const container = new Container();
  const tail = new Graphics();
  const backFin = new Graphics();
  const body = new Graphics();
  const bellyFin = new Graphics();
  const topFin = new Graphics();
  const eye = new Graphics();

  tail
    .moveTo(-48, 0)
    .bezierCurveTo(-116, -58, -138, -24, -106, 0)
    .bezierCurveTo(-138, 24, -116, 58, -48, 0)
    .fill({ color: config.palette.fin, alpha: 0.84 })
    .stroke({ width: 2, color: config.palette.finAccent, alpha: 0.44 });

  backFin
    .moveTo(-18, -22)
    .bezierCurveTo(-58, -76, 22, -78, 48, -18)
    .bezierCurveTo(22, -32, -6, -31, -18, -22)
    .fill({ color: config.palette.fin, alpha: 0.54 });

  bellyFin
    .moveTo(-6, 24)
    .bezierCurveTo(16, 72, 58, 54, 48, 18)
    .bezierCurveTo(30, 31, 12, 32, -6, 24)
    .fill({ color: config.palette.finAccent, alpha: 0.46 });

  topFin
    .moveTo(-18, -24)
    .bezierCurveTo(6, -62, 56, -48, 70, -16)
    .bezierCurveTo(42, -25, 12, -28, -18, -24)
    .fill({ color: config.palette.finAccent, alpha: 0.42 });

  body
    .ellipse(0, 0, 74, 34)
    .fill({ color: config.palette.body, alpha: 0.96 })
    .stroke({ width: 3, color: config.palette.bodyAccent, alpha: 0.38 })
    .ellipse(26, -4, 32, 18)
    .fill({ color: config.palette.bodyAccent, alpha: 0.28 });

  eye.circle(50, -8, 4.5).fill(config.palette.eye).circle(52, -10, 1.4).fill(0xffffff);

  container.addChild(tail, backFin, body, bellyFin, topFin, eye);

  let x = 500;
  let y = config.baseY;
  let direction = 1;
  let pointerInfluence = 0;

  container.position.set(x, y);

  return {
    container,
    update(timeSeconds: number, deltaMS: number, pointer: ScenePointer | null): void {
      const swim = timeSeconds * config.swimSpeed + config.phase;
      const targetX = 500 + Math.sin(swim * 0.52) * 295;
      const targetY = config.baseY + Math.sin(swim * 0.87) * 72 + Math.sin(swim * 0.31) * 28;
      const seconds = deltaMS / 1000;

      pointerInfluence = Math.max(0, pointerInfluence - seconds * 0.9);

      let pointerOffsetX = 0;
      let pointerOffsetY = 0;

      if (pointer !== null && pointer.strength > 0) {
        pointerInfluence = Math.max(pointerInfluence, pointer.strength);
        pointerOffsetX = (pointer.x - x) * 0.08 * pointerInfluence;
        pointerOffsetY = (pointer.y - y) * 0.05 * pointerInfluence;
      }

      x += (targetX + pointerOffsetX - x) * Math.min(1, seconds * 1.35);
      y += (targetY + pointerOffsetY - y) * Math.min(1, seconds * 1.15);

      const nextDirection = targetX >= x ? 1 : -1;
      direction += (nextDirection - direction) * Math.min(1, seconds * 5);

      container.position.set(x, y);
      container.scale.x = direction;
      container.rotation = Math.sin(swim * 0.8) * 0.035;

      tail.scale.x = 1 + Math.sin(swim * 6.4) * 0.08;
      tail.rotation = Math.sin(swim * 5.2) * 0.16;
      backFin.rotation = Math.sin(swim * 2.7) * 0.04;
      topFin.rotation = Math.sin(swim * 2.2) * 0.035;
      bellyFin.rotation = Math.sin(swim * 2.4) * -0.035;
    },
  };
}
```

- [ ] **Step 2: Create procedural plant entities**

Create `src/scene/entities/plants.ts`:

```ts
import { Container, Graphics } from "pixi.js";
import type { PlantConfig } from "../types";

export interface PlantEntity {
  container: Container;
  update(timeSeconds: number): void;
}

export function createPlants(plants: readonly PlantConfig[], floorY: number): PlantEntity[] {
  return plants.map((plant, index) => createPlant(plant, floorY, index));
}

function createPlant(plant: PlantConfig, floorY: number, index: number): PlantEntity {
  const container = new Container();
  const stem = new Graphics();
  const leaves = new Graphics();
  const bladeCount = 4 + (index % 4);

  stem
    .moveTo(0, 0)
    .bezierCurveTo(
      plant.lean * 42,
      -plant.height * 0.34,
      plant.lean * 68,
      -plant.height * 0.72,
      plant.lean * 74,
      -plant.height,
    )
    .stroke({ width: 4, color: plant.color, alpha: 0.76, cap: "round" });

  for (let blade = 0; blade < bladeCount; blade += 1) {
    const ratio = bladeCount === 1 ? 0 : blade / (bladeCount - 1);
    const side = blade % 2 === 0 ? -1 : 1;
    const y = -plant.height * (0.18 + ratio * 0.72);
    const length = plant.width * (0.75 + ratio * 0.6);
    const angle = side * (0.42 + ratio * 0.42) + plant.lean * 0.25;
    const endX = Math.cos(angle - Math.PI / 2) * length;
    const endY = y + Math.sin(angle - Math.PI / 2) * length;

    leaves
      .moveTo(plant.lean * 28 * ratio, y)
      .bezierCurveTo(endX * 0.25, y - length * 0.22, endX * 0.72, endY + length * 0.16, endX, endY)
      .bezierCurveTo(
        endX * 0.58,
        endY + length * 0.18,
        endX * 0.12,
        y + length * 0.08,
        plant.lean * 28 * ratio,
        y,
      )
      .fill({ color: blade % 3 === 0 ? plant.accentColor : plant.color, alpha: 0.76 });
  }

  container.addChild(stem, leaves);
  container.position.set(plant.x, floorY);

  return {
    container,
    update(timeSeconds: number): void {
      const sway = Math.sin(timeSeconds * 0.85 + plant.phase) * 0.045;
      container.rotation = plant.lean * 0.08 + sway;
      leaves.rotation = sway * 0.7;
    },
  };
}
```

- [ ] **Step 3: Create bubble particles**

Create `src/scene/entities/bubbles.ts`:

```ts
import { Container, Graphics } from "pixi.js";
import type { BubbleConfig } from "../types";

export interface BubbleEntity {
  container: Container;
  update(deltaMS: number, waterTopY: number, floorY: number): void;
}

export function createBubbles(bubbles: readonly BubbleConfig[]): BubbleEntity[] {
  return bubbles.map(createBubble);
}

function createBubble(config: BubbleConfig): BubbleEntity {
  const container = new Container();
  const shape = new Graphics();

  shape
    .circle(0, 0, config.radius)
    .stroke({ width: 1.4, color: 0xdaf8ff, alpha: config.alpha })
    .circle(-config.radius * 0.25, -config.radius * 0.25, Math.max(1, config.radius * 0.22))
    .fill({ color: 0xffffff, alpha: config.alpha * 0.6 });

  container.addChild(shape);
  container.position.set(config.x, config.y);
  container.alpha = config.alpha;

  return {
    container,
    update(deltaMS: number, waterTopY: number, floorY: number): void {
      const seconds = deltaMS / 1000;
      container.y -= config.speed * seconds;
      container.x += Math.sin(container.y * 0.035 + config.phase) * 0.22;

      if (container.y < waterTopY + 20) {
        container.y = floorY - 12 - config.phase * 5;
      }
    },
  };
}
```

- [ ] **Step 4: Create aquarium scene assembly**

Create `src/scene/aquarium.ts`:

```ts
import { Application, Container, Graphics } from "pixi.js";
import type { AquariumConfig, ScenePointer } from "./types";
import { createBetta } from "./entities/betta";
import { createBubbles } from "./entities/bubbles";
import { createPlants } from "./entities/plants";

export interface AquariumScene {
  resize(width: number, height: number): void;
  update(deltaMS: number): void;
  setPointer(screenX: number, screenY: number): void;
  destroy(): void;
}

export function createAquariumScene(app: Application, config: AquariumConfig): AquariumScene {
  const root = new Container();
  const background = new Container();
  const tank = new Container();
  const plantsLayer = new Container();
  const bubblesLayer = new Container();
  const fishLayer = new Container();
  const shimmerLayer = new Container();

  const width = config.tank.width;
  const height = config.tank.height;
  const floorY = height - config.substrate.height - 42;
  const waterTopY = height * (1 - config.water.level);
  let timeSeconds = 0;
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let pointer: ScenePointer | null = null;

  root.addChild(background, tank, plantsLayer, bubblesLayer, fishLayer, shimmerLayer);
  app.stage.addChild(root);

  background.addChild(createBackground(config));
  tank.addChild(
    createWater(config, waterTopY),
    createSubstrate(config, floorY),
    createGlass(config),
  );

  const plantEntities = createPlants(config.plants, floorY);
  for (const plant of plantEntities) {
    plantsLayer.addChild(plant.container);
  }

  const bubbleEntities = createBubbles(config.bubbles);
  for (const bubble of bubbleEntities) {
    bubblesLayer.addChild(bubble.container);
  }

  const betta = createBetta(config.betta);
  fishLayer.addChild(betta.container);

  shimmerLayer.addChild(createShimmer(config, waterTopY));

  function resize(screenWidth: number, screenHeight: number): void {
    scale = Math.min(screenWidth / width, screenHeight / height);
    offsetX = (screenWidth - width * scale) / 2;
    offsetY = (screenHeight - height * scale) / 2;
    root.position.set(offsetX, offsetY);
    root.scale.set(scale);
  }

  resize(app.screen.width, app.screen.height);

  return {
    resize,
    update(deltaMS: number): void {
      timeSeconds += deltaMS / 1000;

      const activePointer = pointer;
      if (pointer !== null) {
        pointer = { ...pointer, strength: Math.max(0, pointer.strength - deltaMS / 900) };
        if (pointer.strength <= 0) {
          pointer = null;
        }
      }

      for (const plant of plantEntities) {
        plant.update(timeSeconds);
      }

      for (const bubble of bubbleEntities) {
        bubble.update(deltaMS, waterTopY, floorY);
      }

      betta.update(timeSeconds, deltaMS, activePointer);
      shimmerLayer.alpha = 0.65 + Math.sin(timeSeconds * 0.55 + config.shimmer.phase) * 0.18;
    },
    setPointer(screenX: number, screenY: number): void {
      pointer = {
        x: (screenX - offsetX) / scale,
        y: (screenY - offsetY) / scale,
        strength: 1,
      };
    },
    destroy(): void {
      root.destroy({ children: true });
    },
  };
}

function createBackground(config: AquariumConfig): Graphics {
  return new Graphics()
    .rect(0, 0, config.tank.width, config.tank.height)
    .fill(config.background.bottom)
    .rect(0, 0, config.tank.width, config.tank.height * 0.58)
    .fill({ color: config.background.top, alpha: 0.72 });
}

function createWater(config: AquariumConfig, waterTopY: number): Graphics {
  const waterHeight = config.tank.height - waterTopY - 42;

  return new Graphics()
    .roundRect(42, waterTopY, config.tank.width - 84, waterHeight, 26)
    .fill({ color: config.water.bottomColor, alpha: 0.72 })
    .rect(42, waterTopY, config.tank.width - 84, waterHeight * 0.42)
    .fill({ color: config.water.topColor, alpha: 0.44 })
    .rect(42, waterTopY, config.tank.width - 84, 3)
    .fill({ color: config.water.overlayColor, alpha: 0.48 });
}

function createSubstrate(config: AquariumConfig, floorY: number): Graphics {
  const gravel = new Graphics();
  const top = floorY;
  const height = config.substrate.height;

  gravel
    .roundRect(56, top, config.tank.width - 112, height, 24)
    .fill({ color: config.substrate.color, alpha: 0.92 })
    .ellipse(220, top + 24, 92, 18)
    .fill({ color: config.substrate.accentColor, alpha: 0.22 })
    .ellipse(680, top + 34, 136, 22)
    .fill({ color: config.substrate.accentColor, alpha: 0.16 });

  for (let index = 0; index < 34; index += 1) {
    const x = 82 + ((index * 71) % 840);
    const y = top + 14 + ((index * 29) % Math.max(1, height - 24));
    const radius = 2 + (index % 5);
    gravel.circle(x, y, radius).fill({ color: config.substrate.accentColor, alpha: 0.18 });
  }

  return gravel;
}

function createGlass(config: AquariumConfig): Graphics {
  return new Graphics()
    .roundRect(32, 32, config.tank.width - 64, config.tank.height - 64, config.tank.cornerRadius)
    .stroke({ width: 5, color: config.tank.glassTint, alpha: 0.44 })
    .roundRect(
      48,
      48,
      config.tank.width - 96,
      config.tank.height - 96,
      config.tank.cornerRadius * 0.72,
    )
    .stroke({ width: 1.5, color: 0xffffff, alpha: 0.26 })
    .rect(92, 70, 56, config.tank.height - 170)
    .fill({ color: 0xffffff, alpha: 0.06 });
}

function createShimmer(config: AquariumConfig, waterTopY: number): Graphics {
  const shimmer = new Graphics();

  for (let index = 0; index < 7; index += 1) {
    const y = waterTopY + 34 + index * 54;
    shimmer
      .moveTo(120, y)
      .bezierCurveTo(260, y - 26, 410, y + 30, 560, y)
      .bezierCurveTo(680, y - 20, 770, y + 20, 900, y - 4)
      .stroke({ width: 2, color: config.shimmer.color, alpha: config.shimmer.alpha });
  }

  return shimmer;
}
```

- [ ] **Step 5: Run type checks to catch PixiJS API mistakes**

Run:

```bash
pnpm check
```

Expected: PASS. If it fails, fix only the reported strict TypeScript or PixiJS v8 API issue in the file named by the diagnostic, then rerun `pnpm check`.

- [ ] **Step 6: Commit procedural scene entities**

Run:

```bash
git add src/scene/entities/betta.ts src/scene/entities/plants.ts src/scene/entities/bubbles.ts src/scene/aquarium.ts
git commit -m "feat: add procedural betta aquarium scene"
```

---

## Task 3: Mount PixiJS Through Svelte

**Files:**

- Create: `src/lib/AquariumCanvas.svelte`

- [ ] **Step 1: Create PixiJS canvas component**

Create `src/lib/AquariumCanvas.svelte`:

```svelte
<script lang="ts">
  import { Application } from 'pixi.js'
  import { onDestroy, onMount } from 'svelte'
  import { createAquariumScene, type AquariumScene } from '../scene/aquarium'
  import type { AquariumConfig } from '../scene/types'

  interface Props {
    config: AquariumConfig
  }

  const { config }: Props = $props()

  let host: HTMLDivElement
  let app: Application | null = null
  let scene: AquariumScene | null = null
  let resizeObserver: ResizeObserver | null = null
  let startError = $state<string | null>(null)

  async function start(): Promise<void> {
    startError = null
    cleanup()

    try {
      const nextApp = new Application()

      await nextApp.init({
        resizeTo: host,
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: Math.min(window.devicePixelRatio, 2),
        preference: 'webgl',
        eventFeatures: {
          move: true,
          globalMove: false,
          click: false,
          wheel: false,
        },
      })

      host.appendChild(nextApp.canvas)
      const nextScene = createAquariumScene(nextApp, config)

      nextApp.ticker.add((ticker) => {
        nextScene.update(ticker.deltaMS)
      })

      resizeObserver = new ResizeObserver(() => {
        nextScene.resize(nextApp.screen.width, nextApp.screen.height)
      })
      resizeObserver.observe(host)

      app = nextApp
      scene = nextScene
    } catch (error) {
      startError = error instanceof Error ? error.message : 'PixiJS failed to start.'
      cleanup()
    }
  }

  function cleanup(): void {
    resizeObserver?.disconnect()
    resizeObserver = null
    scene?.destroy()
    scene = null

    if (app !== null) {
      app.destroy(
        { removeView: true, releaseGlobalResources: true },
        { children: true, texture: true, textureSource: true },
      )
      app = null
    }
  }

  function handlePointerMove(event: PointerEvent): void {
    const bounds = host.getBoundingClientRect()
    scene?.setPointer(event.clientX - bounds.left, event.clientY - bounds.top)
  }

  onMount(() => {
    void start()
  })

  $effect(() => {
    config.seed
    if (host !== undefined) {
      void start()
    }
  })

  onDestroy(cleanup)
</script>

<div class="aquarium-canvas" bind:this={host} onpointermove={handlePointerMove}>
  {#if startError !== null}
    <div class="aquarium-fallback" role="status">
      <p>Aquarium could not start.</p>
      <button type="button" onclick={() => void start()}>Retry</button>
    </div>
  {/if}
</div>
```

- [ ] **Step 2: Run Svelte and TypeScript checks**

Run:

```bash
pnpm check
```

Expected: PASS. If Svelte reports event attribute or rune syntax errors, fix `src/lib/AquariumCanvas.svelte` and rerun the same command.

- [ ] **Step 3: Commit PixiJS Svelte bridge**

Run:

```bash
git add src/lib/AquariumCanvas.svelte
git commit -m "feat: mount aquarium canvas in svelte"
```

---

## Task 4: Replace Template App With Ambient Aquarium UI

**Files:**

- Modify: `src/App.svelte`
- Modify: `src/app.css`

- [ ] **Step 1: Replace `App.svelte` with seed controls and fullscreen mode**

Replace `src/App.svelte` with:

```svelte
<script lang="ts">
  import AquariumCanvas from './lib/AquariumCanvas.svelte'
  import { createAquariumConfig } from './scene/config'
  import { normalizeSeed } from './scene/seed'

  const initialSeed = new URLSearchParams(window.location.search).get('seed') ?? 'mossling'

  let seedInput = $state(normalizeSeed(initialSeed))
  let activeSeed = $state(seedInput)
  let uiHidden = $state(false)
  let copyMessage = $state('')

  const config = $derived(createAquariumConfig(activeSeed))

  function applySeed(): void {
    activeSeed = normalizeSeed(seedInput)
    seedInput = activeSeed
    updateUrl(activeSeed)
  }

  function randomizeSeed(): void {
    const nextSeed = normalizeSeed('')
    seedInput = nextSeed
    activeSeed = nextSeed
    updateUrl(nextSeed)
  }

  async function copyLink(): Promise<void> {
    const url = new URL(window.location.href)
    url.searchParams.set('seed', activeSeed)
    await navigator.clipboard.writeText(url.toString())
    copyMessage = 'Copied link'
    window.setTimeout(() => {
      copyMessage = ''
    }, 1600)
  }

  async function enterFullscreen(): Promise<void> {
    if (document.fullscreenElement === null) {
      await document.documentElement.requestFullscreen()
    }
  }

  function updateUrl(seed: string): void {
    const url = new URL(window.location.href)
    url.searchParams.set('seed', seed)
    window.history.replaceState(null, '', url)
  }
</script>

<main class:ui-hidden={uiHidden}>
  <AquariumCanvas {config} />

  <section class="panel" aria-label="Aquarium controls">
    <div class="brand">
      <p>Mossling</p>
      <h1>Ambient betta aquarium</h1>
    </div>

    <form class="seed-form" onsubmit={(event) => { event.preventDefault(); applySeed() }}>
      <label for="seed">Seed</label>
      <div class="seed-row">
        <input id="seed" bind:value={seedInput} autocomplete="off" spellcheck="false" />
        <button type="submit">Apply</button>
      </div>
    </form>

    <div class="actions">
      <button type="button" onclick={randomizeSeed}>Randomize</button>
      <button type="button" onclick={() => void copyLink()}>Copy link</button>
      <button type="button" onclick={() => void enterFullscreen()}>Fullscreen</button>
      <button type="button" onclick={() => { uiHidden = true }}>Hide UI</button>
    </div>

    {#if copyMessage !== ''}
      <p class="copy-message" role="status">{copyMessage}</p>
    {/if}
  </section>

  {#if uiHidden}
    <button class="show-ui" type="button" onclick={() => { uiHidden = false }}>Show UI</button>
  {/if}
</main>
```

- [ ] **Step 2: Replace global app styles**

Replace `src/app.css` with:

```css
:root {
  color: #ecfbff;
  background: #07131f;
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}

html,
body,
#app {
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;
}

button,
input {
  font: inherit;
}

button {
  border: 1px solid rgb(216 247 255 / 24%);
  border-radius: 999px;
  color: #f4fdff;
  background: rgb(10 28 43 / 72%);
  padding: 0.7rem 0.95rem;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    background 160ms ease,
    transform 160ms ease;
}

button:hover {
  border-color: rgb(216 247 255 / 52%);
  background: rgb(28 74 94 / 78%);
  transform: translateY(-1px);
}

input {
  min-width: 0;
  border: 1px solid rgb(216 247 255 / 22%);
  border-radius: 999px;
  color: #f4fdff;
  background: rgb(6 18 28 / 72%);
  padding: 0.7rem 0.95rem;
  outline: none;
}

input:focus {
  border-color: rgb(140 222 242 / 72%);
}

main {
  position: relative;
  width: 100%;
  height: 100%;
  background:
    radial-gradient(circle at 50% 18%, rgb(98 180 206 / 20%), transparent 34%),
    linear-gradient(180deg, #0c2236, #06101a);
}

.aquarium-canvas {
  position: absolute;
  inset: 0;
}

.aquarium-canvas canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.aquarium-fallback {
  position: absolute;
  inset: 50% auto auto 50%;
  display: grid;
  gap: 1rem;
  justify-items: center;
  width: min(24rem, calc(100vw - 2rem));
  padding: 1.4rem;
  border: 1px solid rgb(216 247 255 / 22%);
  border-radius: 1.25rem;
  background: rgb(5 15 24 / 80%);
  transform: translate(-50%, -50%);
}

.panel {
  position: absolute;
  top: 1rem;
  left: 1rem;
  display: grid;
  gap: 1rem;
  width: min(27rem, calc(100vw - 2rem));
  padding: 1rem;
  border: 1px solid rgb(216 247 255 / 18%);
  border-radius: 1.35rem;
  background: rgb(5 15 24 / 52%);
  box-shadow: 0 24px 80px rgb(0 0 0 / 28%);
  backdrop-filter: blur(16px);
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.ui-hidden .panel {
  pointer-events: none;
  opacity: 0;
  transform: translateY(-0.5rem);
}

.brand p,
.brand h1,
.copy-message {
  margin: 0;
}

.brand p {
  color: #9de7f3;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.brand h1 {
  margin-top: 0.18rem;
  color: #f4fdff;
  font-size: clamp(1.5rem, 4vw, 2.45rem);
  line-height: 0.95;
}

.seed-form {
  display: grid;
  gap: 0.45rem;
}

.seed-form label {
  color: #b9eef5;
  font-size: 0.82rem;
  font-weight: 650;
}

.seed-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.copy-message {
  color: #aaf0ce;
  font-size: 0.88rem;
}

.show-ui {
  position: absolute;
  right: 1rem;
  bottom: 1rem;
}

@media (max-width: 640px) {
  .panel {
    right: 1rem;
    width: auto;
  }

  .seed-row {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 3: Run checks after UI replacement**

Run:

```bash
pnpm check
```

Expected: PASS. If `vp check` formats files, run `pnpm exec vp check --fix`, then rerun `pnpm check`.

- [ ] **Step 4: Smoke test local dev startup**

Run:

```bash
timeout 5 pnpm dev || true
```

Expected: Vite+ prints `VITE+` and a local URL. The timeout stops the dev server after startup.

- [ ] **Step 5: Commit ambient UI**

Run:

```bash
git add src/App.svelte src/app.css
git commit -m "feat: add ambient aquarium controls"
```

---

## Task 5: Final Verification and Documentation

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Update README**

Replace `README.md` with:

```md
# Mossling

Mossling is a cozy seeded ambient aquarium built with Svelte, Vite+, TypeScript, and PixiJS.

## Current v1 Scope

The app generates a procedural betta aquarium from a seed. It includes:

- One animated betta fish
- Procedural plants
- Rising bubbles
- Soft water lighting
- Seed input and random generation
- Copyable scene link
- Fullscreen live mode
- Hideable UI overlay

The first version intentionally does not include an object editor, export pipeline, pet-care mechanics, or multiple vessel types.

## Commands

| Command             | Description                                              |
| ------------------- | -------------------------------------------------------- |
| `pnpm dev`          | Start Vite+ dev server                                   |
| `pnpm build`        | Build production app with Vite+                          |
| `pnpm preview`      | Preview production build                                 |
| `pnpm test`         | Run light functional tests                               |
| `pnpm check`        | Run Vite+ check, Svelte check, and node TypeScript check |
| `pnpm check:fallow` | Run Fallow static intelligence                           |
| `pnpm check:all`    | Run tests and all checks                                 |

## Development Notes

- Svelte owns the app shell and controls.
- PixiJS owns the live aquarium canvas.
- Scene generation is deterministic: the same seed produces the same aquarium config.
- Pre-commit hooks run `pnpm check:all` through Husky.
```

- [ ] **Step 2: Run full verification**

Run:

```bash
pnpm test
pnpm check
pnpm check:fallow
pnpm build
```

Expected:

- `pnpm test`: PASS for seed/config tests.
- `pnpm check`: PASS for `vp check`, `svelte-check`, and `tsc`.
- `pnpm check:fallow`: completes. Existing tooling-only dependency false positives are acceptable only if they are still limited to build tool packages.
- `pnpm build`: production build succeeds.

- [ ] **Step 3: Manual functional QA**

Run:

```bash
pnpm dev
```

Open the local URL printed by Vite+. Verify manually:

- Aquarium scene appears.
- Betta animates.
- Plants sway.
- Bubbles rise.
- Randomize changes the scene.
- Re-entering the same seed recreates the same scene composition.
- Copy link writes a URL containing `?seed=`.
- Fullscreen enters fullscreen mode.
- Hide UI hides controls and Show UI restores them.
- Browser resize keeps the aquarium centered and usable.

Stop the dev server after QA.

- [ ] **Step 4: Commit final docs and verification-ready state**

Run:

```bash
git add README.md package.json pnpm-lock.yaml src
git commit -m "docs: describe ambient aquarium v1"
```

- [ ] **Step 5: Push commits**

Run:

```bash
git push
```

Expected: local `main` pushes to `origin/main`.

---

## Self-Review Notes

Spec coverage:

- Seeded ambient aquarium: Task 1 and Task 2.
- Betta fish and plants: Task 2.
- Bubbles and soft lighting: Task 2.
- Minimal controls: Task 4.
- Fullscreen and hide UI: Task 4.
- PixiJS fallback and lifecycle cleanup: Task 3.
- Light functional tests: Task 1 and Task 5.
- Vite+ commands: Task 1 and Task 5.

Type consistency:

- `AquariumConfig` is defined once in `src/scene/types.ts` and consumed by config generation, PixiJS scene creation, and Svelte canvas component.
- `AquariumScene` exposes `resize`, `update`, `setPointer`, and `destroy`; `AquariumCanvas.svelte` uses only those methods.
- Animation functions use PixiJS v8 ticker `ticker.deltaMS`, not the old v7 numeric delta argument.
- Graphics code uses PixiJS v8 shape-then-fill/stroke API, not `beginFill`, `drawRect`, or `lineStyle`.

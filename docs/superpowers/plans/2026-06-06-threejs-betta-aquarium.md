# Three.js Betta Aquarium Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the PixiJS 2D aquarium with a Three.js aquarium that loads the downloaded Betta Mahachai GLB model and keeps the seeded ambient controls.

**Architecture:** Svelte keeps the app shell, seed controls, fullscreen, and hide/show UI. Three.js owns rendering through `ThreeAquariumCanvas.svelte`, which creates a renderer/camera, loads the GLB betta, builds the procedural tank environment, runs animation with `requestAnimationFrame`, resizes, and disposes resources on teardown.

**Tech Stack:** Svelte 5, TypeScript strictest, Vite+, Three.js, GLTFLoader, Vitest via `vp test`, Fallow, Husky.

---

## File Structure

Create, modify, remove, or copy these files:

- Modify `package.json`: remove `pixi.js`, add `three`, keep `vitest`, keep `vp` scripts.
- Copy `/home/yusuf/Downloads/betta_mahachai.glb` to `public/models/betta-mahachai/betta-mahachai.glb`.
- Modify `src/scene/types.ts`: replace Pixi-oriented types with Three.js-oriented config types.
- Modify `src/scene/config.ts`: add stable model path and Three.js environment config.
- Modify `src/scene/config.test.ts`: test model path and renderer-neutral config ranges.
- Keep `src/scene/seed.ts`: deterministic PRNG helpers; no Three.js dependency.
- Remove `src/lib/AquariumCanvas.svelte`.
- Remove `src/scene/aquarium.ts`.
- Remove `src/scene/entities/betta.ts`.
- Remove `src/scene/entities/bubbles.ts`.
- Remove `src/scene/entities/plants.ts`.
- Create `src/lib/ThreeAquariumCanvas.svelte`: Three.js lifecycle bridge.
- Create `src/scene/three/model-loader.ts`: GLB loading and model normalization.
- Create `src/scene/three/environment.ts`: procedural tank, water, substrate, plants, bubbles, lights.
- Create `src/scene/three/betta.ts`: loaded model animation runtime.
- Create `src/scene/three/aquarium.ts`: Three.js scene assembly and update/dispose contract.
- Modify `src/App.svelte`: import `ThreeAquariumCanvas`, keep controls, add attribution line.
- Modify `src/app.css`: keep fullscreen cozy shell, add attribution styling if needed.
- Modify `README.md`: document Three.js scope, model path, and CC BY 4.0 attribution.
- Remove stray `pnpm-workspace.yaml` if present; it was created by pnpm store configuration and is not project scope.

---

## Task 1: Dependencies, Asset, and Failing Config Tests

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Copy: `/home/yusuf/Downloads/betta_mahachai.glb` -> `public/models/betta-mahachai/betta-mahachai.glb`
- Modify: `src/scene/config.test.ts`

- [ ] **Step 1: Swap rendering dependencies**

Run:

```bash
pnpm remove pixi.js
pnpm add three
```

Expected: `package.json` has `three` in `dependencies`, `pixi.js` is gone, and `pnpm-lock.yaml` updates.

- [ ] **Step 2: Copy the GLB model into public assets**

Run:

```bash
mkdir -p public/models/betta-mahachai
cp /home/yusuf/Downloads/betta_mahachai.glb public/models/betta-mahachai/betta-mahachai.glb
```

Expected: `public/models/betta-mahachai/betta-mahachai.glb` exists and will be served by Vite at `/models/betta-mahachai/betta-mahachai.glb`.

- [ ] **Step 3: Remove stray pnpm workspace file if it exists**

Run:

```bash
rm -f pnpm-workspace.yaml
```

Expected: no tracked or untracked `pnpm-workspace.yaml` remains.

- [ ] **Step 4: Write failing Three.js config tests**

Replace `src/scene/config.test.ts` with:

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

  it("generates different environment config for different seeds", () => {
    expect(createAquariumConfig("mossling-a")).not.toEqual(createAquariumConfig("mossling-b"));
  });

  it("uses the stable betta model asset path", () => {
    expect(createAquariumConfig("model-path").model.path).toBe(
      "/models/betta-mahachai/betta-mahachai.glb",
    );
  });

  it("keeps generated values inside cozy 3d aquarium bounds", () => {
    const config = createAquariumConfig("bounds-check");

    expect(config.seed).toBe("bounds-check");
    expect(config.tank.width).toBe(9.6);
    expect(config.tank.height).toBe(5.4);
    expect(config.tank.depth).toBe(3.2);
    expect(config.water.level).toBeGreaterThanOrEqual(0.66);
    expect(config.water.level).toBeLessThanOrEqual(0.82);
    expect(config.plants.length).toBeGreaterThanOrEqual(9);
    expect(config.plants.length).toBeLessThanOrEqual(16);
    expect(config.bubbles.length).toBeGreaterThanOrEqual(18);
    expect(config.bubbles.length).toBeLessThanOrEqual(34);

    for (const plant of config.plants) {
      expect(plant.position.x).toBeGreaterThanOrEqual(-4.1);
      expect(plant.position.x).toBeLessThanOrEqual(4.1);
      expect(plant.position.z).toBeGreaterThanOrEqual(-1.25);
      expect(plant.position.z).toBeLessThanOrEqual(1.25);
      expect(plant.height).toBeGreaterThanOrEqual(0.8);
      expect(plant.height).toBeLessThanOrEqual(2.4);
    }

    for (const bubble of config.bubbles) {
      expect(bubble.radius).toBeGreaterThanOrEqual(0.025);
      expect(bubble.radius).toBeLessThanOrEqual(0.075);
      expect(bubble.speed).toBeGreaterThanOrEqual(0.22);
      expect(bubble.speed).toBeLessThanOrEqual(0.7);
    }
  });
});
```

- [ ] **Step 5: Run tests to verify RED**

Run:

```bash
pnpm test
```

Expected: FAIL because the existing `AquariumConfig` does not have `model`, `tank.depth`, or Three.js position-shaped plant/bubble config yet.

---

## Task 2: Renderer-Neutral Seeded Config

**Files:**

- Modify: `src/scene/types.ts`
- Modify: `src/scene/config.ts`
- Keep: `src/scene/seed.ts`
- Test: `src/scene/config.test.ts`

- [ ] **Step 1: Replace scene types**

Replace `src/scene/types.ts` with:

```ts
export interface Vector3Config {
  x: number;
  y: number;
  z: number;
}

export interface TankConfig {
  width: number;
  height: number;
  depth: number;
  glassColor: number;
}

export interface WaterConfig {
  level: number;
  color: number;
  opacity: number;
}

export interface SubstrateConfig {
  color: number;
  pebbleColor: number;
  height: number;
}

export interface ModelConfig {
  path: string;
  attribution: string;
  licenseUrl: string;
  sourceUrl: string;
  scale: number;
  rotationY: number;
}

export interface BettaConfig {
  swimSpeed: number;
  phase: number;
  pathAmplitudeX: number;
  pathAmplitudeY: number;
  pathAmplitudeZ: number;
}

export interface PlantConfig {
  position: Vector3Config;
  height: number;
  radius: number;
  lean: number;
  color: number;
  accentColor: number;
  phase: number;
}

export interface BubbleConfig {
  position: Vector3Config;
  radius: number;
  speed: number;
  phase: number;
  opacity: number;
}

export interface LightConfig {
  ambientIntensity: number;
  keyIntensity: number;
  fillIntensity: number;
  warmth: number;
}

export interface AquariumConfig {
  seed: string;
  model: ModelConfig;
  tank: TankConfig;
  water: WaterConfig;
  substrate: SubstrateConfig;
  betta: BettaConfig;
  plants: PlantConfig[];
  bubbles: BubbleConfig[];
  lights: LightConfig;
  background: {
    top: number;
    bottom: number;
  };
}
```

- [ ] **Step 2: Replace config generation**

Replace `src/scene/config.ts` with:

```ts
import type { AquariumConfig, PlantConfig } from "./types";
import { createPrng, normalizeSeed } from "./seed";

export const BETTA_MODEL_PATH = "/models/betta-mahachai/betta-mahachai.glb";

const WATER_COLORS = [0x4fb4c8, 0x3fa6bb, 0x5bbbc5, 0x4ca2d8] as const;
const BACKGROUND_TOP_COLORS = [0x10243a, 0x18283f, 0x132f36, 0x1e2441] as const;
const BACKGROUND_BOTTOM_COLORS = [0x07131f, 0x081a21, 0x0c1222, 0x0c1d25] as const;
const SUBSTRATE_COLORS = [0xcaa071, 0xb78e65, 0xd3b07b, 0xa9825f] as const;
const PLANT_COLORS = [0x2fa66a, 0x4eb36a, 0x2d8f78, 0x6fbf73] as const;

export function createAquariumConfig(inputSeed: string): AquariumConfig {
  const seed = normalizeSeed(inputSeed);
  const rng = createPrng(seed);
  const plantCount = rng.int(9, 16);
  const bubbleCount = rng.int(18, 34);

  const plants: PlantConfig[] = Array.from({ length: plantCount }, () => {
    const color = rng.pick(PLANT_COLORS);

    return {
      position: {
        x: rng.range(-4.1, 4.1),
        y: -2.25,
        z: rng.range(-1.25, 1.25),
      },
      height: rng.range(0.8, 2.4),
      radius: rng.range(0.025, 0.06),
      lean: rng.range(-0.32, 0.32),
      color,
      accentColor: color + 0x101000,
      phase: rng.range(0, Math.PI * 2),
    };
  }).sort((left, right) => left.position.x - right.position.x);

  return {
    seed,
    model: {
      path: BETTA_MODEL_PATH,
      attribution: "“Betta Mahachai” by Maruk (@maruk.xyz) on Sketchfab, licensed under CC BY 4.0.",
      licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
      sourceUrl: "https://sketchfab.com/3d-models/betta-mahachai-81b3f2b3db3d4018ae6f1de55edce6e3",
      scale: 2.7,
      rotationY: Math.PI / 2,
    },
    tank: {
      width: 9.6,
      height: 5.4,
      depth: 3.2,
      glassColor: 0xd8f7ff,
    },
    background: {
      top: rng.pick(BACKGROUND_TOP_COLORS),
      bottom: rng.pick(BACKGROUND_BOTTOM_COLORS),
    },
    water: {
      level: rng.range(0.66, 0.82),
      color: rng.pick(WATER_COLORS),
      opacity: rng.range(0.32, 0.46),
    },
    substrate: {
      color: rng.pick(SUBSTRATE_COLORS),
      pebbleColor: 0xf2d19a,
      height: rng.range(0.34, 0.52),
    },
    betta: {
      swimSpeed: rng.range(0.35, 0.62),
      phase: rng.range(0, Math.PI * 2),
      pathAmplitudeX: rng.range(2.1, 3.4),
      pathAmplitudeY: rng.range(0.24, 0.46),
      pathAmplitudeZ: rng.range(0.42, 0.86),
    },
    plants,
    bubbles: Array.from({ length: bubbleCount }, () => ({
      position: {
        x: rng.range(-4.2, 4.2),
        y: rng.range(-1.8, 1.9),
        z: rng.range(-1.35, 1.35),
      },
      radius: rng.range(0.025, 0.075),
      speed: rng.range(0.22, 0.7),
      phase: rng.range(0, Math.PI * 2),
      opacity: rng.range(0.28, 0.68),
    })),
    lights: {
      ambientIntensity: rng.range(0.55, 0.75),
      keyIntensity: rng.range(1.4, 2.1),
      fillIntensity: rng.range(0.45, 0.75),
      warmth: rng.range(0.82, 1),
    },
  };
}
```

- [ ] **Step 3: Run config tests to verify GREEN**

Run:

```bash
pnpm test
```

Expected: PASS for `src/scene/config.test.ts`.

- [ ] **Step 4: Run checks**

Run:

```bash
pnpm check
```

Expected: PASS. If formatting fails, run `pnpm exec vp check --fix`, then rerun `pnpm check`.

- [ ] **Step 5: Commit config cutover**

Run:

```bash
git add package.json pnpm-lock.yaml public/models/betta-mahachai/betta-mahachai.glb src/scene/types.ts src/scene/config.ts src/scene/config.test.ts
git commit -m "feat: add threejs aquarium config"
```

If the commit hook fails because old PixiJS files are now dead, continue to Task 3 and commit the complete renderer cutover after old files are removed and new Three.js files are connected.

---

## Task 3: Three.js Scene Modules

**Files:**

- Create: `src/scene/three/model-loader.ts`
- Create: `src/scene/three/environment.ts`
- Create: `src/scene/three/betta.ts`
- Create: `src/scene/three/aquarium.ts`
- Remove: `src/scene/aquarium.ts`
- Remove: `src/scene/entities/betta.ts`
- Remove: `src/scene/entities/bubbles.ts`
- Remove: `src/scene/entities/plants.ts`

- [ ] **Step 1: Remove PixiJS scene files**

Run:

```bash
rm -rf src/scene/entities
rm -f src/scene/aquarium.ts
```

Expected: no PixiJS scene files remain.

- [ ] **Step 2: Create model loader**

Create `src/scene/three/model-loader.ts`:

```ts
import { AnimationMixer, Box3, Group, Object3D, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { ModelConfig } from "../types";

export interface LoadedBettaModel {
  root: Group;
  mixer: AnimationMixer | null;
  update(deltaSeconds: number): void;
}

export async function loadBettaModel(config: ModelConfig): Promise<LoadedBettaModel> {
  const gltf = await new GLTFLoader().loadAsync(config.path);
  const root = new Group();
  const model = gltf.scene;

  normalizeModel(model, config);
  root.add(model);

  const mixer = gltf.animations.length > 0 ? new AnimationMixer(model) : null;
  const firstClip = gltf.animations[0];

  if (mixer !== null && firstClip !== undefined) {
    mixer.clipAction(firstClip).play();
  }

  return {
    root,
    mixer,
    update(deltaSeconds: number): void {
      mixer?.update(deltaSeconds);
    },
  };
}

function normalizeModel(model: Object3D, config: ModelConfig): void {
  const bounds = new Box3().setFromObject(model);
  const size = bounds.getSize(new Vector3());
  const center = bounds.getCenter(new Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z, 0.001);

  model.position.sub(center);
  model.scale.setScalar(config.scale / maxDimension);
  model.rotation.y = config.rotationY;

  model.traverse((child) => {
    child.frustumCulled = false;
  });
}
```

- [ ] **Step 3: Create environment builders**

Create `src/scene/three/environment.ts`:

```ts
import {
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  EdgesGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  Vector3,
} from "three";
import type { AquariumConfig, BubbleConfig, PlantConfig } from "../types";

export interface EnvironmentRuntime {
  root: Group;
  bubbles: BubbleRuntime[];
  plants: PlantRuntime[];
  water: Mesh;
  dispose(): void;
}

interface BubbleRuntime {
  mesh: Mesh;
  config: BubbleConfig;
  update(deltaSeconds: number, waterTop: number, floorY: number): void;
}

interface PlantRuntime {
  root: Group;
  config: PlantConfig;
  update(timeSeconds: number): void;
}

export function createEnvironment(config: AquariumConfig): EnvironmentRuntime {
  const root = new Group();
  const tank = createTank(config);
  const water = createWater(config);
  const substrate = createSubstrate(config);
  const lights = createLights(config);
  const plants = config.plants.map(createPlant);
  const bubbles = config.bubbles.map(createBubble);

  root.add(tank, water, substrate, lights);
  plants.forEach((plant) => root.add(plant.root));
  bubbles.forEach((bubble) => root.add(bubble.mesh));

  return {
    root,
    bubbles,
    plants,
    water,
    dispose(): void {
      root.traverse(disposeObject);
    },
  };
}

function createTank(config: AquariumConfig): Object3D {
  const group = new Group();
  const geometry = new BoxGeometry(config.tank.width, config.tank.height, config.tank.depth);
  const edges = new EdgesGeometry(geometry);
  const lines = new LineSegments(
    edges,
    new LineBasicMaterial({ color: config.tank.glassColor, transparent: true, opacity: 0.42 }),
  );
  const glass = new Mesh(
    geometry,
    new MeshPhysicalMaterial({
      color: config.tank.glassColor,
      transparent: true,
      opacity: 0.08,
      roughness: 0.05,
      transmission: 0.35,
      depthWrite: false,
    }),
  );

  group.add(glass, lines);
  return group;
}

function createWater(config: AquariumConfig): Mesh {
  const waterHeight = config.tank.height * config.water.level;
  const geometry = new BoxGeometry(config.tank.width - 0.28, waterHeight, config.tank.depth - 0.28);
  const material = new MeshPhysicalMaterial({
    color: config.water.color,
    transparent: true,
    opacity: config.water.opacity,
    roughness: 0.2,
    metalness: 0,
    depthWrite: false,
  });
  const water = new Mesh(geometry, material);
  water.position.y = -config.tank.height / 2 + waterHeight / 2;
  return water;
}

function createSubstrate(config: AquariumConfig): Object3D {
  const group = new Group();
  const substrate = new Mesh(
    new BoxGeometry(config.tank.width - 0.45, config.substrate.height, config.tank.depth - 0.45),
    new MeshStandardMaterial({ color: config.substrate.color, roughness: 0.9 }),
  );
  substrate.position.y = -config.tank.height / 2 + config.substrate.height / 2;
  group.add(substrate);

  const pebbleGeometry = new SphereGeometry(0.045, 8, 6);
  const pebbleMaterial = new MeshStandardMaterial({
    color: config.substrate.pebbleColor,
    roughness: 0.95,
  });

  for (let index = 0; index < 48; index += 1) {
    const pebble = new Mesh(pebbleGeometry, pebbleMaterial);
    pebble.position.set(((index * 1.73) % 8.4) - 4.2, -2.42, ((index * 0.91) % 2.6) - 1.3);
    pebble.scale.setScalar(0.7 + (index % 5) * 0.12);
    group.add(pebble);
  }

  return group;
}

function createPlant(config: PlantConfig): PlantRuntime {
  const root = new Group();
  const stemMaterial = new MeshStandardMaterial({ color: config.color, roughness: 0.65 });
  const leafMaterial = new MeshStandardMaterial({ color: config.accentColor, roughness: 0.7 });
  const stem = new Mesh(
    new CylinderGeometry(config.radius, config.radius * 0.72, config.height, 7),
    stemMaterial,
  );

  stem.position.y = config.height / 2;
  stem.rotation.z = config.lean;
  root.add(stem);

  for (let leafIndex = 0; leafIndex < 4; leafIndex += 1) {
    const leaf = new Mesh(new SphereGeometry(config.radius * 4.5, 10, 6), leafMaterial);
    leaf.position.set(
      (leafIndex % 2 === 0 ? -1 : 1) * config.radius * 5,
      config.height * (0.3 + leafIndex * 0.14),
      0,
    );
    leaf.scale.set(0.45, 1.25, 0.16);
    leaf.rotation.z = (leafIndex % 2 === 0 ? 1 : -1) * 0.72;
    root.add(leaf);
  }

  root.position.set(config.position.x, config.position.y, config.position.z);

  return {
    root,
    config,
    update(timeSeconds: number): void {
      root.rotation.z = Math.sin(timeSeconds * 0.85 + config.phase) * 0.045;
    },
  };
}

function createBubble(config: BubbleConfig): BubbleRuntime {
  const mesh = new Mesh(
    new SphereGeometry(config.radius, 12, 8),
    new MeshPhysicalMaterial({
      color: 0xdaf8ff,
      transparent: true,
      opacity: config.opacity,
      roughness: 0.05,
    }),
  );
  mesh.position.set(config.position.x, config.position.y, config.position.z);

  return {
    mesh,
    config,
    update(deltaSeconds: number, waterTop: number, floorY: number): void {
      mesh.position.y += config.speed * deltaSeconds;
      mesh.position.x += Math.sin(mesh.position.y * 2.7 + config.phase) * 0.002;

      if (mesh.position.y > waterTop) {
        mesh.position.y = floorY + 0.3;
      }
    },
  };
}

function createLights(config: AquariumConfig): Object3D {
  const group = new Group();
  const ambient = new AmbientLight(0xbbeeff, config.lights.ambientIntensity);
  const key = new DirectionalLight(
    new Color(config.lights.warmth, 0.95, 0.84),
    config.lights.keyIntensity,
  );
  const fill = new DirectionalLight(0x68c6ff, config.lights.fillIntensity);

  key.position.set(-3, 5, 5);
  fill.position.set(4, 2, -4);
  group.add(ambient, key, fill);
  return group;
}

function disposeObject(object: Object3D): void {
  if (object instanceof Mesh) {
    object.geometry.dispose();

    if (Array.isArray(object.material)) {
      object.material.forEach((material) => material.dispose());
    } else {
      object.material.dispose();
    }
  }

  if (object instanceof LineSegments) {
    object.geometry.dispose();
    object.material.dispose();
  }

  if (object instanceof Group) {
    return;
  }
}
```

- [ ] **Step 4: Create betta runtime animation**

Create `src/scene/three/betta.ts`:

```ts
import type { Group } from "three";
import type { BettaConfig } from "../types";
import type { LoadedBettaModel } from "./model-loader";

export interface BettaRuntime {
  root: Group;
  update(timeSeconds: number, deltaSeconds: number): void;
  dispose(): void;
}

export function createBettaRuntime(model: LoadedBettaModel, config: BettaConfig): BettaRuntime {
  const root = model.root;
  let previousX = 0;

  return {
    root,
    update(timeSeconds: number, deltaSeconds: number): void {
      const swim = timeSeconds * config.swimSpeed + config.phase;
      const x = Math.sin(swim) * config.pathAmplitudeX;
      const y = Math.sin(swim * 1.7) * config.pathAmplitudeY;
      const z = Math.cos(swim * 0.78) * config.pathAmplitudeZ;
      const direction = x >= previousX ? 1 : -1;

      root.position.set(x, y, z);
      root.rotation.y = direction > 0 ? Math.PI / 2 : -Math.PI / 2;
      root.rotation.z = Math.sin(swim * 1.6) * 0.06;
      model.update(deltaSeconds);
      previousX = x;
    },
    dispose(): void {
      root.clear();
    },
  };
}
```

- [ ] **Step 5: Create Three.js aquarium scene contract**

Create `src/scene/three/aquarium.ts`:

```ts
import { Color, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import type { AquariumConfig } from "../types";
import { createBettaRuntime, type BettaRuntime } from "./betta";
import { createEnvironment, type EnvironmentRuntime } from "./environment";
import { loadBettaModel } from "./model-loader";

export interface ThreeAquariumScene {
  canvas: HTMLCanvasElement;
  ready: Promise<void>;
  resize(width: number, height: number): void;
  update(deltaSeconds: number, timeSeconds: number): void;
  render(): void;
  dispose(): void;
}

export function createThreeAquariumScene(config: AquariumConfig): ThreeAquariumScene {
  const scene = new Scene();
  const camera = new PerspectiveCamera(38, 1, 0.1, 100);
  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  const environment = createEnvironment(config);
  let betta: BettaRuntime | null = null;

  scene.background = new Color(config.background.bottom);
  scene.add(environment.root);
  camera.position.set(0, 1.1, 10.5);
  camera.lookAt(0, 0, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(config.background.bottom, 1);

  const ready = loadBettaModel(config.model).then((model) => {
    betta = createBettaRuntime(model, config.betta);
    scene.add(betta.root);
  });

  return {
    canvas: renderer.domElement,
    ready,
    resize(width: number, height: number): void {
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    },
    update(deltaSeconds: number, timeSeconds: number): void {
      const waterTop = -config.tank.height / 2 + config.tank.height * config.water.level;
      const floorY = -config.tank.height / 2;

      environment.plants.forEach((plant) => plant.update(timeSeconds));
      environment.bubbles.forEach((bubble) => bubble.update(deltaSeconds, waterTop, floorY));
      environment.water.material.opacity =
        config.water.opacity + Math.sin(timeSeconds * 0.55) * 0.025;
      betta?.update(timeSeconds, deltaSeconds);
    },
    render(): void {
      renderer.render(scene, camera);
    },
    dispose(): void {
      betta?.dispose();
      environment.dispose();
      renderer.dispose();
      scene.clear();
    },
  };
}
```

- [ ] **Step 6: Run checks for Three.js type/API errors**

Run:

```bash
pnpm check
```

Expected: PASS or TypeScript reports concrete Three.js API issues. Fix only reported type/API issues, then rerun.

---

## Task 4: Svelte Three.js Canvas and App Cutover

**Files:**

- Remove: `src/lib/AquariumCanvas.svelte`
- Create: `src/lib/ThreeAquariumCanvas.svelte`
- Modify: `src/App.svelte`
- Modify: `src/app.css`

- [ ] **Step 1: Remove old PixiJS canvas component**

Run:

```bash
rm -f src/lib/AquariumCanvas.svelte
```

Expected: old PixiJS component is gone.

- [ ] **Step 2: Create Three.js canvas bridge**

Create `src/lib/ThreeAquariumCanvas.svelte`:

```svelte
<script lang="ts">
  import { onDestroy } from 'svelte'
  import { createThreeAquariumScene, type ThreeAquariumScene } from '../scene/three/aquarium'
  import type { AquariumConfig } from '../scene/types'

  interface Props {
    config: AquariumConfig
  }

  const { config }: Props = $props()

  let host = $state<HTMLDivElement | null>(null)
  let aquarium: ThreeAquariumScene | null = null
  let resizeObserver: ResizeObserver | null = null
  let animationFrame = 0
  let lastTime = 0
  let startError = $state<string | null>(null)
  let loading = $state(true)

  async function start(): Promise<void> {
    if (host === null) {
      return
    }

    const currentHost = host
    cleanup()
    startError = null
    loading = true

    try {
      const nextAquarium = createThreeAquariumScene(config)
      currentHost.appendChild(nextAquarium.canvas)
      nextAquarium.resize(currentHost.clientWidth, currentHost.clientHeight)

      resizeObserver = new ResizeObserver(() => {
        nextAquarium.resize(currentHost.clientWidth, currentHost.clientHeight)
      })
      resizeObserver.observe(currentHost)

      await nextAquarium.ready
      aquarium = nextAquarium
      loading = false
      lastTime = performance.now()
      animationFrame = requestAnimationFrame(frame)
    } catch (error) {
      startError = error instanceof Error ? error.message : 'Three.js aquarium failed to start.'
      loading = false
      cleanup()
    }
  }

  function frame(time: number): void {
    if (aquarium === null) {
      return
    }

    const deltaSeconds = Math.min(0.05, (time - lastTime) / 1000)
    lastTime = time
    aquarium.update(deltaSeconds, time / 1000)
    aquarium.render()
    animationFrame = requestAnimationFrame(frame)
  }

  function cleanup(): void {
    if (animationFrame !== 0) {
      cancelAnimationFrame(animationFrame)
      animationFrame = 0
    }

    resizeObserver?.disconnect()
    resizeObserver = null
    aquarium?.dispose()
    aquarium?.canvas.remove()
    aquarium = null
  }

  $effect(() => {
    const seed = config.seed

    if (host === null || seed.length === 0) {
      return
    }

    void start()
  })

  onDestroy(cleanup)
</script>

<div class="aquarium-canvas" bind:this={host} role="img" aria-label="Animated 3D betta aquarium">
  {#if loading}
    <div class="aquarium-fallback" role="status">
      <p>Loading betta aquarium…</p>
    </div>
  {/if}

  {#if startError !== null}
    <div class="aquarium-fallback" role="status">
      <p>Aquarium could not start.</p>
      <small>{startError}</small>
      <button type="button" onclick={() => void start()}>Retry</button>
    </div>
  {/if}
</div>
```

- [ ] **Step 3: Replace app import and add attribution line**

In `src/App.svelte`:

- Replace `import AquariumCanvas from './lib/AquariumCanvas.svelte'` with:

```ts
import ThreeAquariumCanvas from "./lib/ThreeAquariumCanvas.svelte";
```

- Replace `<AquariumCanvas {config} />` with:

```svelte
<ThreeAquariumCanvas {config} />
```

- Insert this attribution paragraph inside the `.panel`, after the actions block and before the copy message block:

```svelte
<p class="credit">
  Betta model: <a href={config.model.sourceUrl} target="_blank" rel="noreferrer">Betta Mahachai</a>, CC BY 4.0.
</p>
```

Expected: app UI keeps the same controls but now mounts the Three.js canvas and shows non-intrusive model attribution.

- [ ] **Step 4: Add attribution link styles**

Append this to `src/app.css`:

```css
.credit {
  margin: 0;
  color: rgb(210 244 250 / 72%);
  font-size: 0.76rem;
  line-height: 1.35;
}

.credit a {
  color: #9de7f3;
  text-decoration: none;
}

.credit a:hover {
  text-decoration: underline;
}
```

- [ ] **Step 5: Run checks after Svelte cutover**

Run:

```bash
pnpm check
```

Expected: PASS. If formatting fails, run `pnpm exec vp check --fix`, then rerun `pnpm check`.

- [ ] **Step 6: Run Fallow to verify no dead PixiJS code remains**

Run:

```bash
pnpm check:fallow
```

Expected: PASS with no dead PixiJS files or `pixi.js` dependency warnings.

- [ ] **Step 7: Commit renderer cutover**

Run:

```bash
git add package.json pnpm-lock.yaml public/models/betta-mahachai/betta-mahachai.glb src/App.svelte src/app.css src/lib src/scene .fallowrc.json
git commit -m "feat: replace pixijs aquarium with threejs model scene"
```

---

## Task 5: Documentation, Verification, and Push

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Replace README**

Replace `README.md` with:

```md
# Mossling

Mossling is a cozy seeded ambient aquarium built with Svelte, Vite+, TypeScript, and Three.js.

## Current v1 Scope

The app generates a procedural 3D aquarium from a seed and loads an imported betta fish model. It includes:

- One imported 3D betta model
- Procedural 3D tank, water, substrate, plants, and bubbles
- Soft cozy lighting
- Seed input and random generation
- Copyable scene link
- Fullscreen live mode
- Hideable UI overlay

The first version intentionally does not include an object editor, export pipeline, pet-care mechanics, or multiple vessel types.

## Model Attribution

“Betta Mahachai” by Maruk (@maruk.xyz) on Sketchfab, licensed under CC BY 4.0.

- Model source: https://sketchfab.com/3d-models/betta-mahachai-81b3f2b3db3d4018ae6f1de55edce6e3
- License: https://creativecommons.org/licenses/by/4.0/
- App asset path: `public/models/betta-mahachai/betta-mahachai.glb`

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
- Three.js owns the live aquarium canvas.
- Scene generation is deterministic: the same seed produces the same aquarium config.
- The GLB model stays fixed; the seed controls the procedural environment and swim path.
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

- `pnpm test`: PASS for config tests.
- `pnpm check`: PASS for Vite+ formatting/lint, Svelte, and TypeScript.
- `pnpm check:fallow`: PASS with no dead PixiJS code and no unused `pixi.js` dependency.
- `pnpm build`: production build succeeds.

- [ ] **Step 3: Manual functional QA**

Run:

```bash
pnpm dev
```

Open the local URL printed by Vite+. Verify manually:

- 3D aquarium scene appears.
- Betta GLB model appears.
- Betta moves slowly.
- Procedural plants and bubbles appear.
- Randomize changes the procedural environment.
- Re-entering the same seed recreates the same environment.
- Copy link writes a URL containing `?seed=`.
- Fullscreen enters fullscreen mode.
- Hide UI hides controls and Show UI restores them.
- Browser resize keeps the aquarium framed.

Stop the dev server after QA.

- [ ] **Step 4: Commit docs**

Run:

```bash
git add README.md
git commit -m "docs: describe threejs betta aquarium"
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

- Three.js renderer cutover: Task 1, Task 3, Task 4.
- Imported GLB model: Task 1, Task 3, Task 4.
- Remove PixiJS: Task 1 and Task 3.
- Procedural tank/water/substrate/plants/bubbles/lights: Task 3.
- Seeded controls and fullscreen/hide UI: Task 4.
- Attribution: Task 4 and Task 5.
- Light testing only: Task 1, Task 2, Task 5.
- Manual QA: Task 5.

Type consistency:

- `AquariumConfig` includes `model`, `tank`, `water`, `substrate`, `betta`, `plants`, `bubbles`, `lights`, and `background`.
- `createThreeAquariumScene(config)` returns `ThreeAquariumScene` with `canvas`, `ready`, `resize`, `update`, `render`, and `dispose`.
- `ThreeAquariumCanvas.svelte` uses only that scene contract.
- `GLTFLoader` is imported from `three/examples/jsm/loaders/GLTFLoader.js`.
- No PixiJS types, imports, files, or dependencies remain after Task 4.

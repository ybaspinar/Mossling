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
  plantEntities.forEach((plant) => plantsLayer.addChild(plant.container));

  const bubbleEntities = createBubbles(config.bubbles);
  bubbleEntities.forEach((bubble) => bubblesLayer.addChild(bubble.container));

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
      pointer = decayPointer(pointer, deltaMS);

      plantEntities.forEach((plant) => plant.update(timeSeconds));
      bubbleEntities.forEach((bubble) => bubble.update(deltaMS, waterTopY, floorY));
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

function decayPointer(pointer: ScenePointer | null, deltaMS: number): ScenePointer | null {
  if (pointer === null) {
    return null;
  }

  const strength = Math.max(0, pointer.strength - deltaMS / 900);

  if (strength <= 0) {
    return null;
  }

  return { ...pointer, strength };
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

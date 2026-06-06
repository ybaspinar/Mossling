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
    const ratio = blade / (bladeCount - 1);
    const side = (blade % 2) * 2 - 1;
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
      .fill({
        color: [plant.accentColor, plant.color, plant.color][blade % 3] ?? plant.color,
        alpha: 0.76,
      });
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

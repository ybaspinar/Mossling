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

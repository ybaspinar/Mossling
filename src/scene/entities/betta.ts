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

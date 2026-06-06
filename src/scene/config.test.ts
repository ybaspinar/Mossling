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

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

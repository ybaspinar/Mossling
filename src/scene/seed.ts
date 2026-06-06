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

function hashSeed(seed: string): number {
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

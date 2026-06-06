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

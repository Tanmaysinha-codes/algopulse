export const MAX_HISTORY_STEPS = 50000;
export const WEIGHT_COST = 5;
export const LOOKAHEAD_BUFFER = 200;

export const SPEED_PRESETS = [1, 5, 20, 60, 200] as const;
export type SpeedPreset = typeof SPEED_PRESETS[number];

export const GRID_ROWS = 20;
export const GRID_COLS = 40;

export const MAX_ARRAY_SIZE = 100;

export const DIRECTIONS_4 = [
  [-1, 0], // N
  [0, 1],  // E
  [1, 0],  // S
  [0, -1]  // W
];

export const DIRECTIONS_8 = [
  [-1, 0],  // N
  [-1, 1],  // NE
  [0, 1],   // E
  [1, 1],   // SE
  [1, 0],   // S
  [1, -1],  // SW
  [0, -1],  // W
  [-1, -1]  // NW
];

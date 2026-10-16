import { RNG } from '../../utils/rng';
import { GRID_ROWS, GRID_COLS } from '../../utils/constants';

export type MapPresetType = 
  | 'labyrinth' 
  | 'city' 
  | 'river' 
  | 'scatter' 
  | 'chambers' 
  | 'spiral';

export interface MapPresetOption {
  id: MapPresetType;
  label: string;
  description: string;
  iconName: string;
}

export const MAP_PRESET_OPTIONS: MapPresetOption[] = [
  { id: 'labyrinth', label: 'Recursive Labyrinth', description: 'Dense maze with winding corridors', iconName: 'Compass' },
  { id: 'city', label: 'City Blocks', description: 'Urban street grid with building blocks', iconName: 'Building' },
  { id: 'river', label: 'River & Bridges', description: '5x water terrain with stone bridges', iconName: 'Waves' },
  { id: 'chambers', label: 'Connected Chambers', description: 'Segmented rooms with narrow doorways', iconName: 'LayoutGrid' },
  { id: 'scatter', label: 'Random Ruins', description: 'Scattered pillars and rough terrain', iconName: 'Sparkles' },
  { id: 'spiral', label: 'Spiral Funnel', description: 'Concentric winding spiral corridor', iconName: 'RotateCw' },
];

/**
 * Ensures start and target nodes plus their immediate surroundings are walkable.
 */
function protectEndpoints(gridMap: number[], startNode: number, targetNode: number) {
  const clearAround = (idx: number) => {
    const r = Math.floor(idx / GRID_COLS);
    const c = idx % GRID_COLS;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < GRID_ROWS && nc >= 0 && nc < GRID_COLS) {
          const nIdx = nr * GRID_COLS + nc;
          if (nIdx === idx) {
            gridMap[nIdx] = 0;
          } else if (gridMap[nIdx] === 1) {
            // If adjacent is wall, clear at least the direct orthogonals to ensure exit
            if (dr === 0 || dc === 0) gridMap[nIdx] = 0;
          }
        }
      }
    }
  };

  clearAround(startNode);
  clearAround(targetNode);
}

/**
 * Classic Recursive Backtracker Labyrinth (10x20 logical grid mapped to 20x40 display grid).
 */
export function generateMaze(seed: number, startNode: number, targetNode: number): number[] {
  const rng = new RNG(seed);
  const gridMap = new Array(GRID_ROWS * GRID_COLS).fill(1); // all walls
  const unvisited = new Set<number>();
  
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 20; c++) {
      unvisited.add(r * 20 + c);
    }
  }

  const stack = [0];
  unvisited.delete(0);
  gridMap[0] = 0;

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const lr = Math.floor(current / 20);
    const lc = current % 20;

    const neighbors = [];
    if (lr > 0 && unvisited.has((lr - 1) * 20 + lc)) neighbors.push({ nr: lr - 1, nc: lc, d: 'N' });
    if (lr < 9 && unvisited.has((lr + 1) * 20 + lc)) neighbors.push({ nr: lr + 1, nc: lc, d: 'S' });
    if (lc > 0 && unvisited.has(lr * 20 + lc - 1)) neighbors.push({ nr: lr, nc: lc - 1, d: 'W' });
    if (lc < 19 && unvisited.has(lr * 20 + lc + 1)) neighbors.push({ nr: lr, nc: lc + 1, d: 'E' });

    if (neighbors.length === 0) {
      stack.pop();
    } else {
      const next = neighbors[rng.nextInt(0, neighbors.length)];
      const nextLogical = next.nr * 20 + next.nc;
      unvisited.delete(nextLogical);
      stack.push(nextLogical);

      const r = lr * 2;
      const c = lc * 2;
      const nr = next.nr * 2;
      const nc = next.nc * 2;
      
      gridMap[nr * 40 + nc] = 0;
      if (next.d === 'N') gridMap[(r - 1) * 40 + c] = 0;
      if (next.d === 'S') gridMap[(r + 1) * 40 + c] = 0;
      if (next.d === 'W') gridMap[r * 40 + (c - 1)] = 0;
      if (next.d === 'E') gridMap[r * 40 + (c + 1)] = 0;
    }
  }

  const snap = (idx: number) => {
    const r = Math.floor(idx / 40);
    const c = idx % 40;
    const lr = Math.floor(r / 2);
    const lc = Math.floor(c / 2);
    const floorR = lr * 2;
    const floorC = lc * 2;
    gridMap[floorR * 40 + floorC] = 0;
    gridMap[r * 40 + c] = 0;
    
    if (r !== floorR) {
      gridMap[Math.min(r, floorR) * 40 + c] = 0;
    }
    if (c !== floorC) {
      gridMap[r * 40 + Math.min(c, floorC)] = 0;
    }
  };

  snap(startNode);
  snap(targetNode);

  return gridMap;
}

/**
 * City Grid: Regular avenues and streets dividing building blocks with some alleyways.
 */
export function generateCityGrid(seed: number, startNode: number, targetNode: number): number[] {
  const rng = new RNG(seed);
  const gridMap = new Array(GRID_ROWS * GRID_COLS).fill(0); // floor

  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const isAvenue = r % 4 === 0;
      const isStreet = c % 6 === 0;

      // Inside building blocks
      if (!isAvenue && !isStreet) {
        // Leave occasional alleyway
        if (rng.next() > 0.25) {
          gridMap[r * GRID_COLS + c] = 1; // wall
        } else if (rng.next() > 0.6) {
          gridMap[r * GRID_COLS + c] = 2; // slow alley (weight)
        }
      }
    }
  }

  protectEndpoints(gridMap, startNode, targetNode);
  return gridMap;
}

/**
 * River & Bridges: Meandering river of 5x weight cells with stone bridges and rocky banks.
 */
export function generateRiverTerrain(seed: number, startNode: number, targetNode: number): number[] {
  const rng = new RNG(seed);
  const gridMap = new Array(GRID_ROWS * GRID_COLS).fill(0);

  // Meandering river between col 16 and 24
  const centerCol = 20;
  const bridgeRows = [4, 10, 16]; // 3 main bridges across the river

  for (let r = 0; r < GRID_ROWS; r++) {
    // Wander slightly
    const offset = Math.floor(Math.sin(r * 0.45) * 4);
    const currCol = centerCol + offset;
    const width = 3;

    for (let c = currCol - width; c <= currCol + width; c++) {
      if (c >= 0 && c < GRID_COLS) {
        // If this row is a bridge, keep as walkable floor!
        if (bridgeRows.includes(r) && Math.abs(c - currCol) <= 1) {
          gridMap[r * GRID_COLS + c] = 0; // Stone bridge
        } else {
          gridMap[r * GRID_COLS + c] = 2; // River (weight 5x)
        }
      }
    }

    // Add rocky banks / mountain walls on sides
    if (r % 3 === 0) {
      const leftRock = currCol - width - 2;
      const rightRock = currCol + width + 2;
      if (leftRock >= 0 && !bridgeRows.includes(r)) gridMap[r * GRID_COLS + leftRock] = 1;
      if (rightRock < GRID_COLS && !bridgeRows.includes(r)) gridMap[r * GRID_COLS + rightRock] = 1;
    }
  }

  // Scattered peripheral obstacles
  for (let i = 0; i < 40; i++) {
    const r = rng.nextInt(1, GRID_ROWS - 1);
    const c = rng.nextInt(1, GRID_COLS - 1);
    if (Math.abs(c - centerCol) > 5 && gridMap[r * GRID_COLS + c] === 0) {
      gridMap[r * GRID_COLS + c] = 1;
    }
  }

  protectEndpoints(gridMap, startNode, targetNode);
  return gridMap;
}

/**
 * Connected Chambers: Multi-room layout with doorways to test bottleneck routing.
 */
export function generateChambers(seed: number, startNode: number, targetNode: number): number[] {
  const rng = new RNG(seed);
  const gridMap = new Array(GRID_ROWS * GRID_COLS).fill(0);

  const vSplit1 = 13;
  const vSplit2 = 26;
  const hSplit = 10;

  // Build dividing walls
  for (let r = 0; r < GRID_ROWS; r++) {
    gridMap[r * GRID_COLS + vSplit1] = 1;
    gridMap[r * GRID_COLS + vSplit2] = 1;
  }
  for (let c = 0; c < GRID_COLS; c++) {
    gridMap[hSplit * GRID_COLS + c] = 1;
  }

  // Doorways on vertical dividers
  const vDoors = [
    rng.nextInt(2, 8),
    rng.nextInt(12, 18),
    rng.nextInt(2, 8),
    rng.nextInt(12, 18),
  ];
  gridMap[vDoors[0] * GRID_COLS + vSplit1] = 0;
  gridMap[vDoors[1] * GRID_COLS + vSplit1] = 0;
  gridMap[vDoors[2] * GRID_COLS + vSplit2] = 0;
  gridMap[vDoors[3] * GRID_COLS + vSplit2] = 0;

  // Doorways on horizontal divider
  const hDoors = [
    rng.nextInt(3, 10),
    rng.nextInt(16, 23),
    rng.nextInt(29, 37),
  ];
  hDoors.forEach(c => {
    gridMap[hSplit * GRID_COLS + c] = 0;
  });

  // Internal room furniture/pillars
  for (let r = 2; r < GRID_ROWS - 2; r += 3) {
    for (let c = 3; c < GRID_COLS - 3; c += 4) {
      if (gridMap[r * GRID_COLS + c] === 0 && rng.next() > 0.4) {
        gridMap[r * GRID_COLS + c] = rng.next() > 0.3 ? 1 : 2;
      }
    }
  }

  protectEndpoints(gridMap, startNode, targetNode);
  return gridMap;
}

/**
 * Random Ruins: Scattered wall pillars and weight quagmires.
 */
export function generateRandomScatter(seed: number, startNode: number, targetNode: number): number[] {
  const rng = new RNG(seed);
  const gridMap = new Array(GRID_ROWS * GRID_COLS).fill(0);

  for (let i = 0; i < GRID_ROWS * GRID_COLS; i++) {
    const roll = rng.next();
    if (roll < 0.26) {
      gridMap[i] = 1; // wall
    } else if (roll < 0.36) {
      gridMap[i] = 2; // weight
    }
  }

  protectEndpoints(gridMap, startNode, targetNode);
  return gridMap;
}

/**
 * Spiral Funnel: Outer-to-inner winding labyrinth corridor.
 */
export function generateSpiral(_seed: number, startNode: number, targetNode: number): number[] {
  const gridMap = new Array(GRID_ROWS * GRID_COLS).fill(0);

  let top = 0;
  let bottom = GRID_ROWS - 1;
  let left = 0;
  let right = GRID_COLS - 1;

  while (top < bottom - 2 && left < right - 2) {
    // Top border
    for (let c = left; c <= right; c++) {
      if (top > 0) gridMap[top * GRID_COLS + c] = 1;
    }
    // Right border
    for (let r = top; r <= bottom; r++) {
      gridMap[r * GRID_COLS + right] = 1;
    }
    // Bottom border
    for (let c = right; c >= left; c--) {
      gridMap[bottom * GRID_COLS + c] = 1;
    }
    // Left border
    for (let r = bottom; r >= top + 2; r--) {
      gridMap[r * GRID_COLS + left] = 1;
    }

    // Leave entrance gap on top
    if (top + 1 < GRID_ROWS) gridMap[(top + 1) * GRID_COLS + left] = 0;
    if (top > 0) gridMap[top * GRID_COLS + left + 1] = 0;

    top += 2;
    bottom -= 2;
    left += 2;
    right -= 2;
  }

  protectEndpoints(gridMap, startNode, targetNode);
  return gridMap;
}

/**
 * Dispatcher to generate map presets by ID.
 */
export function generatePresetMap(preset: MapPresetType, seed: number, startNode: number, targetNode: number): number[] {
  switch (preset) {
    case 'labyrinth': return generateMaze(seed, startNode, targetNode);
    case 'city': return generateCityGrid(seed, startNode, targetNode);
    case 'river': return generateRiverTerrain(seed, startNode, targetNode);
    case 'chambers': return generateChambers(seed, startNode, targetNode);
    case 'scatter': return generateRandomScatter(seed, startNode, targetNode);
    case 'spiral': return generateSpiral(seed, startNode, targetNode);
    default: return generateMaze(seed, startNode, targetNode);
  }
}

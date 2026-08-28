import { RNG } from '../../utils/rng';

export function generateMaze(seed: number, startNode: number, targetNode: number): number[] {
  const rng = new RNG(seed);
  const gridMap = new Array(800).fill(1); // all walls
  const unvisited = new Set<number>();
  
  for(let r = 0; r < 10; r++) {
    for(let c = 0; c < 20; c++) {
      unvisited.add(r * 20 + c);
    }
  }

  const stack = [0];
  unvisited.delete(0);
  gridMap[0] = 0; // floor at [0,0] display (logic 0,0)

  while(stack.length > 0) {
    const current = stack[stack.length - 1];
    const lr = Math.floor(current / 20);
    const lc = current % 20;

    const neighbors = [];
    if (lr > 0 && unvisited.has((lr - 1) * 20 + lc)) neighbors.push({nr: lr - 1, nc: lc, d: 'N'});
    if (lr < 9 && unvisited.has((lr + 1) * 20 + lc)) neighbors.push({nr: lr + 1, nc: lc, d: 'S'});
    if (lc > 0 && unvisited.has(lr * 20 + lc - 1)) neighbors.push({nr: lr, nc: lc - 1, d: 'W'});
    if (lc < 19 && unvisited.has(lr * 20 + lc + 1)) neighbors.push({nr: lr, nc: lc + 1, d: 'E'});

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
    
    // Direct opening carved
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

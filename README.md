# AlgoPulse

AlgoPulse is an interactive algorithm visualizer for exploring sorting and pathfinding algorithms in the browser. It presents algorithm execution as inspectable steps with playback controls, live metrics, pseudocode, and editable pathfinding grids.

The current scope is:

- Sorting
- Pathfinding

## Overview

AlgoPulse is built as a portfolio-oriented React application that makes algorithm behavior easier to follow visually. Sorting runs on seeded arrays, while pathfinding runs on an editable grid with walls, weights, configurable movement, and generated mazes.

## Features

- Interactive visualizations for five sorting algorithms.
- Interactive grid-based visualizations for four pathfinding algorithms.
- Play, pause, reset, regenerate, and speed controls.
- Step forward and step backward through generated history.
- Algorithm-specific metrics, including comparisons, swaps, writes, visited nodes, path length, path cost, and elapsed time where applicable.
- Synchronized pseudocode display with the active algorithm line.
- Seeded sorting input for reproducible arrays.
- Editable pathfinding grids with wall, weight, start, target, and erase tools.
- Optional diagonal movement for pathfinding algorithms that support it.
- Deterministic maze generation when regenerating a pathfinding layout.
- Dark and light themes with local persistence.
- Responsive desktop and mobile layouts, including a mobile pseudocode drawer.
- Keyboard controls for playback and pathfinding-grid navigation.
- Screen-reader announcements for completion and pathfinding outcomes.
- Optional Web Audio tones during visualization playback.
- URL state serialization for sharing the current mode, algorithm, speed, size, seed, grid, and pathfinding endpoints.
- Web Worker execution for pathfinding, with a main-thread fallback if the worker fails.
- Completion confetti that respects the `prefers-reduced-motion` setting.

## Algorithms

### Sorting

| Algorithm | Time complexity | Space complexity | Description |
| --- | --- | --- | --- |
| Bubble Sort | `O(n²)` | `O(1)` | Repeatedly compares adjacent values and swaps them when they are out of order. |
| Selection Sort | `O(n²)` | `O(1)` | Selects the minimum remaining value and places it at the next sorted position. |
| Insertion Sort | `O(n²)` | `O(1)` | Inserts each value into its position within the sorted prefix. |
| Quick Sort | `O(n log n)` | `O(log n)` | Partitions around a pivot and recursively sorts the two partitions. |
| Merge Sort | `O(n log n)` | `O(n)` | Recursively divides the array and merges sorted ranges using auxiliary arrays. |

The displayed complexity values match the algorithm registry used by the application.

### Pathfinding

| Algorithm | Time complexity | Space complexity | Description |
| --- | --- | --- | --- |
| Breadth-First Search (BFS) | `O(V + E)` | `O(V)` | Explores the grid with a queue. It is optimal for unweighted four-directional movement. |
| Depth-First Search (DFS) | `O(V + E)` | `O(V)` | Explores the grid with a stack and does not guarantee a shortest path. |
| Dijkstra's Algorithm | `O((V + E) log V)` | `O(V)` | Uses a priority queue to expand the lowest-cost known node and supports weights. |
| A* Search | `O((V + E) log V)` | `O(V)` | Uses a priority queue with a heuristic toward the target and supports weights. |

`V` represents grid vertices and `E` represents traversable edges. The displayed values match the algorithm registry.

## Pathfinding Behavior

- **Walls:** Wall cells are not traversable.
- **Weighted nodes:** Weight cells add `WEIGHT_COST` to traversals for Dijkstra's Algorithm and A* Search. BFS and DFS do not support weighted costs.
- **Diagonal movement:** The `8-Way` option enables eight-direction movement for supported pathfinding algorithms. It is disabled for BFS in the controls.
- **Corner-cutting rule:** A diagonal move is rejected when either orthogonal flank cell is a wall.
- **Start and target:** Start and target cells can be moved with the corresponding tools. They are kept distinct by the grid editor.
- **Maze generation:** Regenerating a pathfinding layout uses the current seed to generate a deterministic maze and preserves the start and target openings.
- **Optimality:** BFS is considered optimal only for four-directional, unweighted movement. Dijkstra's Algorithm and A* Search are marked as optimal in the registry. DFS is not marked as optimal. Found-path events carry an `optimal` value based on these run settings.

## Tech Stack

- React and React DOM
- TypeScript
- Vite
- Tailwind CSS via `@tailwindcss/vite`
- Lucide React
- Vitest and Testing Library for tests
- Web Workers for pathfinding execution
- Web Audio API for optional playback tones
- `canvas-confetti` for completion feedback
- `clsx` and `tailwind-merge` for class composition

## Project Structure

```text
algopulse/
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── src/
    ├── App.tsx
    ├── index.css
    ├── main.tsx
    ├── components/
    │   ├── CodePanel.tsx
    │   ├── ControlBar.tsx
    │   ├── ErrorBoundary.tsx
    │   ├── MetricsPanel.tsx
    │   └── Navbar.tsx
    ├── contexts/
    │   ├── AppContext.tsx
    │   └── AppContextValue.ts
    ├── features/
    │   ├── pathfinding/
    │   │   ├── mazeAlgos.ts
    │   │   ├── pathAlgos.test.ts
    │   │   ├── pathAlgos.ts
    │   │   ├── PathGrid.tsx
    │   │   └── workerParity.test.ts
    │   └── sorting/
    │       ├── sortingAlgos.test.ts
    │       ├── sortingAlgos.ts
    │       └── SortingBoard.tsx
    ├── hooks/
    │   ├── useAudio.ts
    │   ├── useExecutionEngine.test.ts
    │   └── useExecutionEngine.ts
    ├── test/
    │   └── setup.ts
    ├── types/
    │   ├── registry.ts
    │   └── steps.ts
    ├── utils/
    │   ├── algorithmRegistry.ts
    │   ├── constants.ts
    │   ├── minHeap.ts
    │   ├── rng.ts
    │   └── urlState.ts
    └── workers/
        └── algorithmWorker.ts
```

## Getting Started

```bash
git clone <repository-url>
cd algopulse
npm install
npm run dev
```

The development server is provided by Vite.

## Testing

Run the complete Vitest suite:

```bash
npm run test
```

Other available validation commands:

```bash
npm run lint
npm run build
```

The `build` script runs TypeScript checking before the Vite production build. `preview` is also available for serving the built application locally:

```bash
npm run preview
```

## Production Build

```bash
npm run build
```

Vite writes the production output to the `dist/` directory.

## Deployment

### GitHub Pages

GitHub Pages is not currently configured in this repository. There is no GitHub Pages workflow or deployment configuration included.

## Accessibility

- Playback controls expose accessible labels and can be operated with the keyboard.
- Global `Space`, `ArrowLeft`, and `ArrowRight` keyboard controls support play/pause and stepping when focus is not inside an interactive form control.
- Pathfinding cells use a roving tab stop, arrow-key navigation, and `Space`/`Enter` activation. `Escape` removes focus from the active cell.
- Completion and pathfinding results are announced through an `aria-live` region.
- Theme and tool controls expose accessible labels or visible labels.
- Start, target, and weight cells use icons in addition to color.
- Completion confetti is skipped when `prefers-reduced-motion: reduce` is enabled.

## Performance

- The execution engine fills a bounded lookahead history instead of eagerly materializing an entire run.
- History is capped by `MAX_HISTORY_STEPS`.
- Playback advances through `requestAnimationFrame` and can consume multiple steps at higher speeds.
- Sorting bars and pathfinding cells use memoized React components.
- Algorithm events use copied array or grid snapshots so displayed history remains stable as execution continues.
- Pathfinding Web Workers use acknowledgement-based bounded execution and notify the engine as steps become available.

## Testing Status

The current repository contains four test files covering 42 tests across sorting algorithms, pathfinding algorithms, worker parity, and the execution engine. The test environment uses Vitest with a jsdom setup.

## Author

Tanmay Sinha

## License

No license has currently been specified for this repository.

import { generatePath } from '../features/pathfinding/pathAlgos';

let generator: ReturnType<typeof generatePath> | null = null;
let acks = 0;

function loop() {
  while (acks > 0 && generator) {
    const { value, done } = generator.next();
    if (done) {
      postMessage({ type: 'DONE' });
      generator = null;
      break;
    }
    if (value) {
      postMessage({ type: 'STEP', entry: value });
      acks--;
    }
  }
}

self.onmessage = (e) => {
  const data = e.data;
  if (data.type === 'START') {
    generator = generatePath(
      data.payload.algorithmId,
      data.payload.startNode,
      data.payload.targetNode,
      data.payload.gridMap,
      data.payload.diagonalEnabled
    );
    acks = data.payload.lookahead;
    loop();
  } else if (data.type === 'ACK') {
    acks += data.count || 1;
    loop();
  } else if (data.type === 'STOP') {
    generator = null;
    acks = 0;
  }
};

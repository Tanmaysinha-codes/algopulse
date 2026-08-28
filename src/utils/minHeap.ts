export class MinHeap<T> {
  private heap: { item: T, priority: number, order: number }[] = [];
  private insertOrder = 0;

  enqueue(item: T, priority: number) {
    this.heap.push({ item, priority, order: this.insertOrder++ });
    this.bubbleUp(this.heap.length - 1);
  }

  dequeue(): T | undefined {
    if (this.isEmpty()) return undefined;
    const min = this.heap[0].item;
    const end = this.heap.pop();
    if (this.heap.length > 0 && end) {
      this.heap[0] = end;
      this.sinkDown(0);
    }
    return min;
  }

  isEmpty() { return this.heap.length === 0; }
  get size() { return this.heap.length; }

  private bubbleUp(idx: number) {
    const element = this.heap[idx];
    while (idx > 0) {
      const parentIdx = Math.floor((idx - 1) / 2);
      const parent = this.heap[parentIdx];
      if (element.priority > parent.priority || (element.priority === parent.priority && element.order > parent.order)) break;
      this.heap[idx] = parent;
      idx = parentIdx;
    }
    this.heap[idx] = element;
  }

  private sinkDown(idx: number) {
    const length = this.heap.length;
    const element = this.heap[idx];
    while (idx < length) {
      const leftChildIdx = 2 * idx + 1;
      const rightChildIdx = 2 * idx + 2;
      let swapIdx = -1;

      if (leftChildIdx < length) {
        const left = this.heap[leftChildIdx];
        if (left.priority < element.priority || (left.priority === element.priority && left.order < element.order)) {
          swapIdx = leftChildIdx;
        }
      }
      if (rightChildIdx < length) {
        const right = this.heap[rightChildIdx];
        const compareTo = swapIdx === -1 ? element : this.heap[swapIdx];
        if (right.priority < compareTo.priority || (right.priority === compareTo.priority && right.order < compareTo.order)) {
          swapIdx = rightChildIdx;
        }
      }
      if (swapIdx === -1) break;
      this.heap[idx] = this.heap[swapIdx];
      idx = swapIdx;
    }
    this.heap[idx] = element;
  }
}

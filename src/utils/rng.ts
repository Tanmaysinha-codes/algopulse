export class RNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  public next(): number {
    this.state = (this.state * 1664525 + 1013904223) % 4294967296;
    return this.state / 4294967296;
  }

  public nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }
}

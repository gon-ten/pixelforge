export class WaitGroup {
  protected count: number = 0;

  protected signal: PromiseWithResolvers<void> = Promise.withResolvers<void>();

  #done: boolean = false;

  constructor() {
    this.signal.promise.finally(() => {
      this.#done = true;
    });
  }

  add(amout: number): void {
    if (this.#done) {
      throw new Error('WaitGroup is already done');
    }
    this.count += amout;
  }

  done(): void {
    if (this.#done) {
      throw new Error('WaitGroup is already done');
    }
    const count = --this.count;
    if (count <= 0) {
      this.signal.resolve();
    }
  }

  wait(): Promise<void> {
    if (this.count === 0) {
      this.signal.resolve();
    }
    return this.signal.promise;
  }
}

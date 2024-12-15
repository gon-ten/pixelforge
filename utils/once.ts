// deno-lint-ignore no-explicit-any
export function once<T extends (...args: any[]) => any>(fn: T): T {
  let called = false;
  let returnValue: ReturnType<T>;
  return (
    (...args) => {
      if (called) {
        return returnValue;
      }
      called = true;
      returnValue = fn(...args);
      return returnValue;
    }
  ) as T;
}

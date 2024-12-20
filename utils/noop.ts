export function noop(): undefined {
  // do nothing
}

export function asyncNoop(): Promise<undefined> {
  return Promise.resolve(undefined);
}

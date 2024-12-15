export async function isPromiseResolved(
  promise: Promise<unknown>,
): Promise<boolean> {
  const expectedValue = Symbol();
  const value = await Promise.race([promise, Promise.resolve(expectedValue)]);
  return value !== expectedValue;
}

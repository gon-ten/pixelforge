export function arrify<T>(input: T | T[]): T[] {
  if (input == null) {
    return [];
  }

  if (Array.isArray(input)) {
    return input;
  }

  return [input];
}

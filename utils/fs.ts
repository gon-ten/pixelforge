import { readFile } from 'node:fs/promises';

export async function readFileBytes(path: string): Promise<Uint8Array> {
  const buffer = await readFile(path);
  // @ts-expect-error this is fine
  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}

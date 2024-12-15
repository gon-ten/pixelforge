import { access, constants } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { readFileBytes } from './fs.ts';

const COMMA = ',';
const SEMICOLON = ';';

function isFileUrl(source: string): boolean {
  return source.startsWith('file://');
}

function isHttpUrl(source: string): boolean {
  return source.startsWith('http://') || source.startsWith('https://');
}

function isDataUrl(source: string): boolean {
  return source.startsWith('data:');
}

function isRelativePath(source: string): boolean {
  return source.startsWith('.') || source.startsWith('..');
}

function parseDataUrl(source: string): {
  mime: string;
  data: string;
  isBase64: boolean;
} {
  const [header, data] = source.split(COMMA);
  const [mime, encoding] = header.slice(5).split(SEMICOLON);

  return {
    mime,
    data,
    isBase64: encoding === 'base64',
  };
}

async function checkIfFileExists(path: string): Promise<void> {
  const filePath = isFileUrl(path) ? fileURLToPath(path) : path;
  try {
    await access(filePath, constants.F_OK);
  } catch {
    throw new Error('The file you are trying to load does not exist');
  }
}

async function fetchRemoteAsset(url: string): Promise<Uint8Array> {
  const response = await fetch(url, { method: 'GET' });
  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

export async function loadAsset(
  source: string,
  options?: {
    cwd?: string;
  },
): Promise<Uint8Array> {
  if (isDataUrl(source)) {
    const { data, mime, isBase64 } = parseDataUrl(source);

    if (!isBase64) {
      throw new TypeError('Only base64 data url is supported');
    }

    const blob = new Blob([atob(data)], { type: mime });
    return new Uint8Array(await blob.arrayBuffer());
  }

  if (isHttpUrl(source)) {
    return await fetchRemoteAsset(source);
  }

  if (isFileUrl(source)) {
    await checkIfFileExists(source);
    return await readFileBytes(fileURLToPath(source));
  }

  if (isAbsolute(source)) {
    await checkIfFileExists(source);
    return await readFileBytes(source);
  }

  if (isRelativePath(source)) {
    const cwd = options?.cwd ?? process.cwd();
    const path = join(cwd, source);
    await checkIfFileExists(path);
    return await readFileBytes(path);
  }

  throw new Error('Not implemented');
}

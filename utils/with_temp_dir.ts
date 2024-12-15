export async function withTempDir(
  cb: (tempDir: string) => Promise<void> | void,
) {
  const tempDir = await Deno.makeTempDir();
  try {
    await Promise.resolve().then(() => cb(tempDir));
  } finally {
    await Deno.remove(tempDir, { recursive: true }).catch(() => null);
  }
}

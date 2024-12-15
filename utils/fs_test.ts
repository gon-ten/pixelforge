import { join } from '@std/path/join';
import { readFileBytes } from './fs.ts';
import { withTempDir } from './with_temp_dir.ts';
import { assertEquals } from '@std/assert';

Deno.test('readFileBytes', async (t) => {
  await t.step('read file bytes', async () => {
    await withTempDir(async (tempDir) => {
      const tempFile = './test.txt';
      const tempFilePath = join(tempDir, tempFile);
      await Deno.writeTextFile(tempFilePath, 'Hello, World!', {
        create: true,
      });
      const data = await readFileBytes(tempFilePath);
      assertEquals(data, new TextEncoder().encode('Hello, World!'));
    });
  });
});

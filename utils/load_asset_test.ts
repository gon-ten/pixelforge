import { assertEquals, assertRejects } from '@std/assert';
import { loadAsset } from './load_asset.ts';
import { withTempDir } from './with_temp_dir.ts';
import { toFileUrl } from '@std/path/to-file-url';
import { join } from '@std/path/join';
import { SEPARATOR } from '@std/path/constants';

Deno.test('loadAsset', async (t) => {
  await t.step('data url', async (t) => {
    await t.step('base64', async () => {
      const content =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAAtJREFUGFdjYAACAAAFAAGq1chRAAAAAElFTkSuQmCC';
      const data = await loadAsset(`data:image/png;base64,${content}`);
      const expectedValue = new Blob([atob(content)], { type: 'image/png' });
      assertEquals(data, new Uint8Array(await expectedValue.arrayBuffer()));
    });

    await t.step('plain text', async () => {
      await assertRejects(
        () => loadAsset('data:text/plain,Hello%2C%20World!'),
        'Only base64 data url is supported',
      );
    });
  });

  await t.step('file url', async (t) => {
    await t.step('file exists', async () => {
      await withTempDir(async (tempDir) => {
        const tempFile = './test.txt';
        const tempFilePath = join(tempDir, tempFile);
        await Deno.writeTextFile(tempFilePath, 'Hello, World!', {
          create: true,
        });
        const data = await loadAsset(toFileUrl(tempFilePath).href);
        assertEquals(data, new TextEncoder().encode('Hello, World!'));
      });
    });

    await t.step('file does not exist', async () => {
      await withTempDir(async (tempDir) => {
        const tempFile = './test.txt';
        const tempFilePath = join(tempDir, tempFile);
        await assertRejects(
          () => loadAsset(toFileUrl(tempFilePath).href),
          'The file you are trying to load does not exist',
        );
      });
    });
  });

  await t.step('fs path', async (t) => {
    await t.step('absolute path', async (t) => {
      await t.step('file exists', async () => {
        await withTempDir(async (tempDir) => {
          const tempFile = './test.txt';
          const tempFilePath = join(tempDir, tempFile);
          await Deno.writeTextFile(tempFilePath, 'Hello, World!', {
            create: true,
          });
          const data = await loadAsset(tempFilePath);
          assertEquals(data, new TextEncoder().encode('Hello, World!'));
        });
      });

      await t.step('file does not exist', async () => {
        await withTempDir(async (tempDir) => {
          const tempFile = './test.txt';
          const tempFilePath = join(tempDir, tempFile);
          await assertRejects(
            () => loadAsset(tempFilePath),
            'The file you are trying to load does not exist',
          );
        });
      });
    });

    await t.step('relative path', async (t) => {
      await t.step('file exists', async () => {
        await withTempDir(async (tempDir) => {
          const tempFile = './test.txt';
          const tempFilePath = join(tempDir, tempFile);
          await Deno.writeTextFile(tempFilePath, 'Hello, World!', {
            create: true,
          });
          const [cwd, ...relativePathParth] = tempFilePath.slice(1).split(
            SEPARATOR,
          );
          const data = await loadAsset(
            `.${SEPARATOR}${relativePathParth.join(SEPARATOR)}`,
            {
              cwd: `/${cwd}`,
            },
          );
          assertEquals(data, new TextEncoder().encode('Hello, World!'));
        });
      });

      await t.step('file does not exist', async () => {
        await assertRejects(
          () => loadAsset(`../${crypto.randomUUID()}.txt`),
          'The file you are trying to load does not exist',
        );
      });
    });
  });

  await t.step('http', async () => {
    await using server = Deno.serve(() => new Response('Hello, World!'));
    const url = `http://${server.addr.hostname}:${server.addr.port}/test.txt`;
    const data = await loadAsset(url);
    assertEquals(data, new TextEncoder().encode('Hello, World!'));
  });

  await t.step('not implemented', async () => {
    await assertRejects(
      () => loadAsset(`not-implemented://test.txt`),
      'Not implemented',
    );
  });
});

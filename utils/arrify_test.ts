import { arrify } from './arrify.ts';
import { assertEquals } from '@std/assert';

Deno.test('arrify', async (t) => {
  await t.step('single value', () => {
    const result = arrify('hello');
    assertEquals(result, ['hello']);
  });

  await t.step('array value', () => {
    const result = arrify(['hello']);
    assertEquals(result, ['hello']);
  });

  await t.step('null value', () => {
    const result = arrify(null);
    assertEquals(result, []);
  });

  await t.step('undefined value', () => {
    const result = arrify(undefined);
    assertEquals(result, []);
  });

  await t.step('empty array value', () => {
    const result = arrify([]);
    assertEquals(result, []);
  });
});

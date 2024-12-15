import { assertEquals } from '@std/assert';
import { once } from './once.ts';

Deno.test('once', async (t) => {
  await t.step('should call function only once', () => {
    let count = 0;
    const increment = once(() => ++count);
    assertEquals(increment(), 1);
    assertEquals(increment(), 1);
  });
});

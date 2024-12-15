import { isPromiseResolved } from './is_promise_resolved.ts';
import { assertEquals, assertRejects } from '@std/assert';

Deno.test('isPromiseResolved - resolved promise', async (t) => {
  await t.step('resolved promise', async () => {
    const resolvedPromise = Promise.resolve('resolved');
    const result = await isPromiseResolved(resolvedPromise);
    assertEquals(result, true);
  });

  await t.step('unresolved promise', async () => {
    const unresolvedPromise = new Promise(() => {});
    const result = await isPromiseResolved(unresolvedPromise);
    assertEquals(result, false);
  });

  await t.step('rejected promise', async () => {
    const rejectedPromise = Promise.reject('rejected');
    await assertRejects(() => isPromiseResolved(rejectedPromise));
  });
});

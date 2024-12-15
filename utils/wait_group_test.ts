import { isPromiseResolved } from './is_promise_resolved.ts';
import { WaitGroup } from './wait_group.ts';
import { assertEquals, assertThrows } from '@std/assert';

class ExtendedWaitGroup extends WaitGroup {
  getSignal() {
    return this.signal;
  }

  getCount() {
    return this.count;
  }
}

Deno.test('WaitGroup', async (t) => {
  await t.step('count should match when adding/marking as done tasks', () => {
    const wg = new ExtendedWaitGroup();
    wg.add(2);
    wg.add(1);
    assertEquals(wg.getCount(), 3);
    wg.done();
    assertEquals(wg.getCount(), 2);
    wg.done();
    assertEquals(wg.getCount(), 1);
    wg.done();
    assertEquals(wg.getCount(), 0);
  });

  await t.step('should throw an error when wg is done', async () => {
    const wg = new ExtendedWaitGroup();
    wg.add(1);
    wg.done();
    await wg.wait();
    assertThrows(() => wg.add(1), 'WaitGroup is already done');
    assertThrows(() => wg.done(), 'WaitGroup is already done');
  });

  await t.step(
    'calling done should resolve when there is no pending tasks',
    async () => {
      const wg = new ExtendedWaitGroup();
      wg.done();
      assertEquals(await isPromiseResolved(wg.getSignal().promise), true);
    },
  );

  await t.step(
    'calling wait should resolve when there is no pending tasks',
    async () => {
      const wg = new ExtendedWaitGroup();
      wg.wait();
      assertEquals(await isPromiseResolved(wg.getSignal().promise), true);
    },
  );
});

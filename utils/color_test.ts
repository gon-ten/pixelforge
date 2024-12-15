import {
  colorStringToRgbaColor,
  hexToRgba,
  rgbaColorStringToRgbaColor,
} from './color.ts';
import { assertEquals, assertThrows } from '@std/assert';

Deno.test('hexToRgba ', async (t) => {
  await t.step('hex without alpla', () => {
    const hex = '#ff0000';
    const rgba = hexToRgba(hex);
    assertEquals(rgba, [255, 0, 0, 1]);
  });

  await t.step('hex with alpha', () => {
    const hex = '#ff000099';
    const rgba = hexToRgba(hex);
    assertEquals(rgba, [255, 0, 0, 0.6]);
  });

  await t.step('short hex', () => {
    const hex = '#f00';
    const rgba = hexToRgba(hex);
    assertEquals(rgba, [255, 0, 0, 1]);
  });

  await t.step('invalid hex', () => {
    const hex = '#ff000';
    assertThrows(() => hexToRgba(hex), 'Invalid hex color');
  });
});

Deno.test('rgbaColotStringToRgbaColor', async (t) => {
  await t.step('valid rgba color', () => {
    const rgbaStr = 'rgba(255, 0, 0, 1)';
    const rgba = rgbaColorStringToRgbaColor(rgbaStr);
    assertEquals(rgba, [255, 0, 0, 1]);
  });

  await t.step('valid rgba color with floating alpha', () => {
    const rgbaStr = 'rgba(255, 0, 0, 0.6)';
    const rgba = rgbaColorStringToRgbaColor(rgbaStr);
    assertEquals(rgba, [255, 0, 0, 0.6]);
  });

  await t.step('valid rgba color with floating alpha no zero padding', () => {
    const rgbaStr = 'rgba(255, 0, 0, .6)';
    const rgba = rgbaColorStringToRgbaColor(rgbaStr);
    assertEquals(rgba, [255, 0, 0, 0.6]);
  });

  await t.step('invalid rgba color value', async (t) => {
    await t.step('invalid red value', () => {
      const rgbaStr = 'rgba(256, 0, 0, 1)';
      assertThrows(
        () => rgbaColorStringToRgbaColor(rgbaStr),
        'Invalid rgba color',
      );
    });
    await t.step('invalid green value', () => {
      const rgbaStr = 'rgba(255, 256, 0, 1)';
      assertThrows(
        () => rgbaColorStringToRgbaColor(rgbaStr),
        'Invalid rgba color',
      );
    });
    await t.step('invalid blue value', () => {
      const rgbaStr = 'rgba(255, 0, 256, 1)';
      assertThrows(
        () => rgbaColorStringToRgbaColor(rgbaStr),
        'Invalid rgba color',
      );
    });
    await t.step('invalid alpha value', () => {
      const rgbaStr = 'rgba(255, 0, 0, 1.1)';
      assertThrows(
        () => rgbaColorStringToRgbaColor(rgbaStr),
        'Invalid rgba color',
      );
    });
    await t.step('any negative value', () => {
      const rgbaStr = 'rgba(-1, 0, 0, 1)';
      assertThrows(
        () => rgbaColorStringToRgbaColor(rgbaStr),
        'Invalid rgba color',
      );
    });
  });
});

Deno.test('colorStringToRgbaColor', async (t) => {
  await t.step('hex color', () => {
    const colorStr = '#ff0000';
    const rgba = colorStringToRgbaColor(colorStr);
    assertEquals(rgba, [255, 0, 0, 1]);
  });

  await t.step('rgba color', () => {
    const colorStr = 'rgba(255, 0, 0, 1)';
    const rgba = colorStringToRgbaColor(colorStr);
    assertEquals(rgba, [255, 0, 0, 1]);
  });
});

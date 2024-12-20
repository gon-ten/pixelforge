import { useRef } from 'preact/hooks';
import { logger } from '../utils/logger.ts';
import { FontStyle } from '../components/LoadFont.tsx';
import type { Font } from 'canvaskit-wasm';
import { useRenderingContext } from '../Renderer.tsx';
import { useFontContext } from './FontContext.tsx';

export const useOptionalStableCallback = <
  // deno-lint-ignore no-explicit-any
  T extends (...args: any[]) => Promise<any> | any,
>(
  fn: T,
): T => {
  const fnRef = useRef<T>(fn);
  fnRef.current = fn;

  const stableFnRef = useRef(
    (...args: Parameters<T>): ReturnType<T> => fnRef.current(...args),
  );

  return stableFnRef.current as T;
};

export const useStableCallback = <
  // deno-lint-ignore no-explicit-any
  T extends (...args: any[]) => Promise<any> | any,
>(
  fn: T,
): T => {
  const fnRef = useRef<T>(fn);
  fnRef.current = fn;

  const stableFnRef = useRef(
    (...args: Parameters<T>): ReturnType<T> => fnRef.current(...args),
  );

  return stableFnRef.current as T;
};

export const useLogger = (component: string) => {
  const log = useRef(logger.extend(component));
  return log.current;
};

export type FontManager = {
  use: (args: {
    family?: string;
    size: number;
    style: FontStyle;
  }) => Font;
};

export const useFontManager = (): FontManager => {
  const log = useLogger('useFontManager');
  const { CanvasKit } = useRenderingContext();
  const { typefaces, craftedFonts, defaultTypeFace } = useFontContext();

  return {
    use(args: { family?: string; size: number; style: FontStyle }): Font {
      let { family, size = 16, style = FontStyle.Regular } = args;

      if (!family && defaultTypeFace.current) {
        family = defaultTypeFace.current;
      }

      const defaultFont = new CanvasKit.Font(null, size);

      if (!family) {
        return defaultFont;
      }

      const typeface = typefaces[family]?.[style];

      if (!typeface) {
        log(`Font ${family} is not loaded. Using default font`);
        return defaultFont;
      }

      const font = craftedFonts[family]?.[style]?.[size];

      if (font) {
        return font;
      }

      const newFont = new CanvasKit.Font(typeface, size);
      craftedFonts[family] ??= {};
      craftedFonts[family][style] ??= {};
      craftedFonts[family][style]![size] = newFont;
      return newFont;
    },
  };
};

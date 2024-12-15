import { createContext, type FunctionComponent, RefObject } from 'preact';
import CanvasKitInit, {
  type Canvas,
  Font,
  type Surface,
  Typeface,
} from 'canvaskit-wasm/full';
import { useContext, useEffect, useId, useRef, useState } from 'preact/hooks';
import type { WaitGroup } from './utils/wait_group.ts';
import { FontStyle } from './components/LoadFont.tsx';
import { useMainContext } from './mod.ts';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from './utils/logger.ts';

type RenderArgs<D extends unknown, S extends Record<string, unknown>> = {
  data: D;
  canvas: Canvas;
  surface: Surface;
  CanvasKit: typeof CanvasKit;
  parentData: ParentData;
  state: S;
};

type AfterRenderHook<D extends unknown, S extends Record<string, unknown>> = (
  args: RenderArgs<D, S>,
) => void;

type RenderFn<D extends unknown, S extends Record<string, unknown>> = (
  args: RenderArgs<D, S>,
) => Promise<void> | void;

const useOptionalStableCallback = <
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

// deno-lint-ignore no-explicit-any
const useStableCallback = <T extends (...args: any[]) => Promise<any> | any>(
  fn: T,
): T => {
  const fnRef = useRef<T>(fn);
  fnRef.current = fn;

  const stableFnRef = useRef(
    (...args: Parameters<T>): ReturnType<T> => fnRef.current(...args),
  );

  return stableFnRef.current as T;
};

function noop(): undefined {
  // do nothing
}

export const useRenderer = <
  S extends Record<string, unknown> = Record<string, unknown>,
  D extends unknown = unknown,
>(args: {
  name: string;
  renderFn: RenderFn<D, S>;
  loader?: () => Promise<D>;
  resolveNextParentContext(
    args: { data: D; currentParent: ParentData; state: S },
  ): ParentData;
  afterRender?: AfterRenderHook<D, S>;
}) => {
  const {
    name,
    renderFn,
    resolveNextParentContext,
    loader = noop,
    afterRender = noop,
  } = args;
  const id = useId();
  const parent = useParent();
  const renderFnStable = useStableCallback(renderFn);
  const { wg, stack, canvas, surface, CanvasKit } = useRenderingContext();
  const stableLoader = useOptionalStableCallback(loader);

  const stableAfterRender = useOptionalStableCallback(afterRender);

  const getNextParentContext = useRef(resolveNextParentContext);
  getNextParentContext.current = resolveNextParentContext;

  const stableGetNextParentContext = useRef(() =>
    getNextParentContext.current({
      data: dataRef.current as D,
      currentParent: parent,
      state: state.current,
    })
  );

  const state = useRef<S>({} as S);

  const dataRef = useRef<D | undefined>(undefined);

  const pushStack = useRef(
    once(() => {
      wg.add(1);
      stack.push([id, name + ' Render', async () => {
        const data = await stableLoader();

        dataRef.current = data;

        await Promise.resolve().then(
          () =>
            renderFnStable({
              canvas,
              surface,
              CanvasKit,
              data: data as D,
              parentData: parent,
              state: state.current,
            }),
        );
      }]);
    }),
  );

  pushStack.current();

  const ack = () => {
    stack.push([id, name + ' AfterRender', () => {
      stableAfterRender({
        canvas,
        surface,
        CanvasKit,
        data: dataRef.current as D,
        parentData: parent,
        state: state.current,
      });
    }]);
    wg.done();
  };

  const stableAck = useStableCallback(ack);

  return {
    id,
    ack: stableAck,
    getNextParentContext: stableGetNextParentContext.current,
  };
};

export function once<T>(fn: (...args: T[]) => void) {
  let called = false;
  return () => {
    if (called) {
      return;
    }
    fn();
    called = true;
  };
}

const __dirname = fileURLToPath(new URL('.', import.meta.url).href);

const CanvasKit = await CanvasKitInit({
  locateFile: (file) =>
    resolve(__dirname, 'node_modules', 'canvaskit-wasm', 'bin', 'full', file),
});

export type RendererProps = {
  width: number;
  height: number;
};

type ContextState = {
  size: {
    width: number;
    height: number;
  };
  stack: [id: string, name: string, fn: () => void | Promise<void>][];
  canvas: Canvas;
  wg: WaitGroup;
  surface: Surface;
  CanvasKit: typeof CanvasKit;
};

export type MandatoryProps = {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
};

export const RenderingContext = createContext<ContextState | null>(
  null,
);

export const useRenderingContext = () => {
  const ctx = useContext(RenderingContext);
  if (!ctx) {
    throw Error('RenderingContext is not provided');
  }
  return ctx;
};

export const RenderAck: FunctionComponent<{ id: string; ack: () => void }> = (
  { ack },
) => {
  useState(() => ack());

  return false;
};

export const Renderer: FunctionComponent<RendererProps> = (
  { width, height, children },
) => {
  const { wg, onDone } = useMainContext();

  const id = useId();

  const log = useLogger('Renderer');

  const stack = useRef<ContextState['stack']>([]);

  const [surface] = useState(() =>
    CanvasKit.MakeSurface(width || 1, height || 1)!
  );

  const [canvas] = useState(() => surface.getCanvas());

  useEffect(() => {
    wg.wait().then(async () => {
      if (!surface) {
        throw Error('Surface is not created');
      }
      for (const [id, name, fn] of stack.current) {
        log('Running %s -> %s', id, name);
        await Promise.resolve().then(fn);
      }
      const bytes = surface.makeImageSnapshot().encodeToBytes();
      if (!bytes) {
        throw Error('Failed to encode image');
      }
      onDone(bytes);
    });
  }, [surface, wg]);

  return (
    <FontContextProvider>
      <RenderingContext.Provider
        value={{
          canvas,
          wg,
          size: { width, height },
          surface,
          CanvasKit,
          stack: stack.current,
        }}
      >
        <ParentContext.Provider
          value={{
            get() {
              return { id, x: 0, y: 0, width, height };
            },
          }}
        >
          {children}
        </ParentContext.Provider>
      </RenderingContext.Provider>
    </FontContextProvider>
  );
};

type ParentData = Required<MandatoryProps>;

export type ParentContextValue = {
  get: () => ParentData;
};

export const ParentContext = createContext<
  { get: () => ParentData } | null
>(null);

export const useParent = () => {
  const ctx = useContext(ParentContext);
  if (!ctx) {
    throw Error('ParentContext is not provided');
  }
  return ctx.get();
};

type FontContextValue = {
  typefaces: {
    [family: string]: {
      [style: string]: Typeface;
    };
  };
  craftedFonts: {
    [family: string]: Partial<
      Record<FontStyle, {
        [size: number]: Font;
      }>
    >;
  };
  registerTypeface: (args: {
    family: string;
    style: FontStyle;
    bytes: Uint8Array;
    isDefault?: boolean;
  }) => void;
  defaultTypeFace: RefObject<string | undefined>;
};

const FontContext = createContext<FontContextValue | null>(null);

export const useFontContext = () => {
  const ctx = useContext(FontContext);
  if (!ctx) {
    throw Error('FontContext is not provided');
  }
  return ctx;
};

const FontContextProvider: FunctionComponent = ({ children }) => {
  const log = useLogger('FontContextProvider');

  const defaultTypeFace = useRef<string | undefined>();

  const typefaces = useRef<FontContextValue['typefaces']>({});

  const craftedFonts = useRef<
    FontContextValue['craftedFonts']
  >({});

  const registerTypeface = useRef<FontContextValue['registerTypeface']>(
    ({ family, style, bytes, isDefault }) => {
      const typeface = CanvasKit.Typeface.MakeFreeTypeFaceFromData(
        bytes,
      );

      if (!typeface) {
        throw Error(`Failed to load font ${family}`);
      }

      if (isDefault) {
        if (!defaultTypeFace.current) {
          defaultTypeFace.current = family;
        } else {
          log('Default typeface is already set. Ignoring');
        }
      }

      typefaces.current[family] ??= {};
      typefaces.current[family][style] = typeface;
    },
  );

  return (
    <FontContext.Provider
      value={{
        typefaces: typefaces.current,
        registerTypeface: registerTypeface.current,
        craftedFonts: craftedFonts.current,
        defaultTypeFace: defaultTypeFace,
      }}
    >
      {children}
    </FontContext.Provider>
  );
};

export const useFontManager = () => {
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

export const useLogger = (component: string) => {
  const log = useRef(logger.extend(component));
  return log.current;
};

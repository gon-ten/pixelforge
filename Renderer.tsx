import { createContext, type FunctionComponent } from 'preact';
import CanvasKitInit, { type Canvas, type Surface } from 'canvaskit-wasm/full';
import { useContext, useEffect, useId, useRef, useState } from 'preact/hooks';
import type { WaitGroup } from './utils/wait_group.ts';
import { useMainContext } from './mod.ts';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ParentContext } from './core/ParentContext.tsx';
import { useLogger } from './core/hooks.ts';
import { FontContextProvider } from './core/FontContext.tsx';
import { ImageFormat } from './core/constants.ts';
import { DefaultsProvider } from './core/DefaultsContext.tsx';

const __dirname = fileURLToPath(new URL('.', import.meta.url).href);

const CanvasKit = await CanvasKitInit({
  locateFile: (file) =>
    resolve(__dirname, 'node_modules', 'canvaskit-wasm', 'bin', 'full', file),
});

const ImageFormatMap = {
  [ImageFormat.JPEG]: CanvasKit.ImageFormat.JPEG,
  [ImageFormat.PNG]: CanvasKit.ImageFormat.PNG,
  [ImageFormat.WEBP]: CanvasKit.ImageFormat.WEBP,
};

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

export const RenderAck: FunctionComponent<{ id: string; ack: () => null }> = (
  { ack },
) => {
  return ack();
};

export const Renderer: FunctionComponent<RendererProps> = (
  { width, height, children },
) => {
  const { wg, onDone, format, quality } = useMainContext();

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
      const bytes = surface.makeImageSnapshot().encodeToBytes(
        ImageFormatMap[format],
        quality,
      );
      if (!bytes) {
        throw Error('Failed to encode image');
      }
      onDone(bytes);
    });
  }, [surface, wg]);

  return (
    <DefaultsProvider>
      <FontContextProvider CanvasKit={CanvasKit}>
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
    </DefaultsProvider>
  );
};

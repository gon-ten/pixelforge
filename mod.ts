import { Browser } from 'happy-dom';
import { type ComponentType, createContext, h, render } from 'preact';
import { useContext } from 'preact/hooks';
import { WaitGroup } from './utils/wait_group.ts';
import { writeFile } from 'node:fs/promises';
import { Renderer } from './Renderer.tsx';
import { ImageFormat } from './core/constants.ts';

export { ImageFormat, Renderer };

export {
  ClipRect,
  type ClipRectProps,
  Container,
  type ContainerProps,
  LinearGradient,
  type LinearGradientProps,
  Picture,
  type PictureProps,
  Text,
  type TextProps,
} from './components/index.tsx';

type MainContextProps = {
  wg: WaitGroup;
  onDone: (bytes: Uint8Array) => void;
  format: ImageFormat;
  quality: number;
};

export const MainContext = createContext<
  MainContextProps | null
>(null);

export const useMainContext = () => {
  const ctx = useContext(MainContext);
  if (ctx === null) {
    throw new Error(
      'useMainContext must be used inside a MainContext.Provider',
    );
  }
  return ctx;
};

export async function generate(
  Component: ComponentType,
  {
    fileName,
    format = ImageFormat.PNG,
    quality = 100,
  }: {
    fileName: string;
    format?: ImageFormat;
    quality?: number;
  },
): Promise<void> {
  const browser = new Browser();
  const page = browser.newPage();
  // @ts-expect-error this is fine
  globalThis.document = page.mainFrame.document;

  const wg = new WaitGroup();
  const signal = Promise.withResolvers<Uint8Array>();
  render(
    h(MainContext.Provider, {
      value: {
        wg,
        onDone: signal.resolve,
        format,
        quality,
      },
    }, [h(Component, null)]),
    page.mainFrame.document.body,
  );
  const bytes = await signal.promise;

  await writeFile(fileName, bytes);

  // @ts-expect-error this is fine
  delete globalThis.document;

  return Promise.resolve();
}

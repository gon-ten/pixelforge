import { createContext, type FunctionComponent, RefObject } from 'preact';
import { CanvasKit, type Font, type Typeface } from 'canvaskit-wasm';
import { useContext, useRef } from 'preact/hooks';
import { FontStyle } from '../components/LoadFont.tsx';
import { useLogger } from './hooks.ts';

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

export const FontContextProvider: FunctionComponent<{ CanvasKit: CanvasKit }> =
  ({ children, CanvasKit }) => {
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

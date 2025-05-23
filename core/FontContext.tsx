import { createContext, type FunctionComponent, RefObject } from 'preact';
import { CanvasKit, type Font, type Typeface } from 'canvaskit-wasm';
import { useContext, useRef } from 'preact/hooks';
import { FontStyle } from '../components/LoadFont.tsx';
import { loadAsset } from '../utils/load_asset.ts';
import { logger } from '../utils/logger.ts';

const log = logger.extend('FontContextProvider');

const NotoSans = await loadAsset('../assets/NotoSans-VariableFont.ttf');
const NotoColorEmoji = await loadAsset('../assets/NotoColorEmoji-Regular.ttf');

type FontContextValue = {
  typefaces: {
    [family: string]: {
      styles: Partial<
        Record<FontStyle, {
          raw: Uint8Array;
          typeface: Typeface;
        }>
      >;
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

export const useFontManager = () => {
  const { typefaces } = useFontContext();

  return {
    allRaw(
      family: string[],
    ): [family: string, bytes: Uint8Array][] {
      const result: [family: string, bytes: Uint8Array][] = [];

      for (const f of family) {
        const typeface = typefaces[f];

        if (!typeface) {
          continue;
        }

        const allBytes = Object.values(typeface.styles).map((style) =>
          style.raw
        );

        for (const bytes of allBytes) {
          result.push([f, bytes]);
        }
      }
      return result;
    },
  };
};

export const FontContextProvider: FunctionComponent<{ CanvasKit: CanvasKit }> =
  ({ children, CanvasKit }) => {
    const defaultTypeFace = useRef<string | undefined>();

    const typefaces = useRef<FontContextValue['typefaces']>(
      defaultTypepaces(CanvasKit),
    );

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

        typefaces.current[family] ??= {
          styles: {},
        };
        typefaces.current[family].styles[style] = {
          raw: bytes,
          typeface,
        };
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

function defaultTypepaces(CanvasKit: CanvasKit) {
  const typefaces: FontContextValue['typefaces'] = {};

  const notoSansTypeface = CanvasKit.Typeface.MakeFreeTypeFaceFromData(
    NotoSans,
  );

  if (notoSansTypeface) {
    typefaces['NotoSans'] = {
      styles: {
        [FontStyle.Regular]: {
          raw: NotoSans,
          typeface: notoSansTypeface,
        },
      },
    };
  } else {
    log('Failed to load NotoSans font');
  }

  const notoColorEmojiTypeface = CanvasKit.Typeface.MakeFreeTypeFaceFromData(
    NotoColorEmoji,
  );

  if (notoColorEmojiTypeface) {
    typefaces['NotoColorEmoji'] = {
      styles: {
        [FontStyle.Regular]: {
          raw: NotoColorEmoji,
          typeface: notoColorEmojiTypeface,
        },
      },
    };
  } else {
    log('Failed to load NotoColorEmoji font');
  }

  return typefaces;
}

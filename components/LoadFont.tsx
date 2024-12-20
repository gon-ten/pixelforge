import { type FunctionComponent } from 'preact';
import { useRenderingContext } from '../Renderer.tsx';
import { loadAsset } from '../utils/load_asset.ts';
import { useId } from 'preact/hooks';
import { useLogger } from '../core/hooks.ts';
import { useFontContext } from '../core/FontContext.tsx';

export enum FontStyle {
  Thin = 'thin',
  ThinItalic = 'thin-italic',
  Light = 'light',
  LightItalic = 'light-italic',
  Regular = 'regular',
  RegularItalic = 'regular-italic',
  Medium = 'medium',
  MediumItalic = 'medium-italic',
  Bold = 'bold',
  BoldItalic = 'bold-italic',
  Black = 'black',
  BlackItalic = 'black-italic',
}

type LoadFontProps = {
  default?: boolean;
  style?: FontStyle;
  family: string;
  src: string;
};

export const LoadFont: FunctionComponent<LoadFontProps> = (
  { family, src, default: isDefault, style = FontStyle.Regular },
) => {
  const id = useId();
  const log = useLogger('LoadFont');
  const { stack } = useRenderingContext();
  const { registerTypeface, typefaces } = useFontContext();

  stack.push([
    id,
    'LoadFont',
    async () => {
      if (Reflect.has(typefaces, src)) {
        log(`Font already loaded: ${family}. Skipping.`);
        return;
      }
      try {
        const bytes = await loadAsset(src);
        registerTypeface({
          family,
          bytes,
          isDefault,
          style,
        });
        log(`Font loaded: ${family}`);
      } catch (err) {
        log(`Failed to load font: ${src}`, err);
      }
    },
  ]);

  return false;
};

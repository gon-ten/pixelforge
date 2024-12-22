import {
  type FunctionComponent,
  isValidElement,
  toChildArray,
  VNode,
} from 'preact';
import { anyColorFormatToColor, ColorValue } from '../utils/color.ts';
import { Component, useRenderer } from '../core/render.ts';
import { useLogger } from '../core/hooks.ts';
import { CanvasKit, type TextStyle } from 'canvaskit-wasm';
import merge from 'lodash.merge';
import { useDefaults } from '../core/DefaultsContext.tsx';
import { arrify } from '../utils/arrify.ts';
import { useFontManager } from '../core/FontContext.tsx';

export type ParagraphProps = {
  fontFamily?: string | string[];
  fontSize?: number;
  color?: ColorValue;
  x?: number;
  y?: number;
  width?: number | `${number}%`;
  align?: 'left' | 'center';
  lineHeight?: number;
};

export const Paragraph: FunctionComponent<ParagraphProps> = (
  {
    fontFamily,
    fontSize,
    x = 0,
    y = 0,
    color = '#000',
    width = '100%',
    children,
    lineHeight,
  },
) => {
  const log = useLogger('Paragraph');

  const defaults = useDefaults();

  const fontFamilies = arrify(fontFamily ?? defaults.textStyle.fontFamily);

  const fontManager = useFontManager();

  const renderer = useRenderer({
    name: 'Paragraph',
    render({ canvas, surface, CanvasKit, parentData }) {
      const renderX = parentData.x + (x ?? 0);
      const renderY = parentData.y + (y ?? 0);

      const typefaceFontManager = CanvasKit.TypefaceFontProvider.Make();

      fontManager.allRaw(fontFamilies).forEach(([family, bytes]) => {
        typefaceFontManager.registerFont(
          bytes,
          family,
        );
      });

      const fontCollection = CanvasKit.FontCollection.Make();
      fontCollection.setDefaultFontManager(typefaceFontManager);

      const baseTextStyle: TextStyle = new CanvasKit.TextStyle({
        fontFamilies,
        fontSize: fontSize ?? defaults.textStyle.fontSize,
        color: CanvasKit.Color(
          ...anyColorFormatToColor(color ?? defaults.textStyle.color),
        ),
        heightMultiplier: lineHeight ?? defaults.textStyle.lineHeight,
      });

      const paragraphStyle = new CanvasKit.ParagraphStyle(
        {
          textStyle: baseTextStyle,
          textAlign: CanvasKit.TextAlign.Center,
        },
      );

      const paragraphBuilder = CanvasKit.ParagraphBuilder
        .MakeFromFontCollection(
          paragraphStyle,
          fontCollection,
        );

      for (const itemContent of toChildArray(children)) {
        if (typeof itemContent === 'string') {
          paragraphBuilder.addText(itemContent);
        } else if (isValidElement(itemContent)) {
          const partialTextStyle = getFontStyleByVNodeType(
            itemContent,
            CanvasKit,
          );
          paragraphBuilder.pushStyle(
            merge({}, baseTextStyle, partialTextStyle),
          );
          paragraphBuilder.addText(String(itemContent.props.children));
          paragraphBuilder.pop();
        }
      }

      const containerWidth = typeof width === 'string'
        ? (parseInt(width) / 100) * parentData.width
        : width;

      const paragraph = paragraphBuilder.build();
      paragraph.layout(containerWidth);

      canvas.drawParagraph(
        paragraph,
        renderX,
        renderY,
      );

      paragraph.delete();
      typefaceFontManager.delete();
      paragraphBuilder.delete();
      surface.flush();
      log('Rendered Parragraph at %d %d', renderX, renderY);
    },
    resolveNextParentContext({ currentParent }) {
      return { ...currentParent };
    },
  });

  return <Component {...renderer} />;
};

function getFontStyleByVNodeType(
  // deno-lint-ignore ban-types
  vnode: VNode<{}>,
  CanvasKit: CanvasKit,
): TextStyle {
  if (vnode.type === 'b') {
    return {
      fontStyle: {
        weight: CanvasKit.FontWeight.Bold,
      },
    };
  }

  if (vnode.type === 'i') {
    return {
      fontStyle: {
        slant: CanvasKit.FontSlant.Italic,
      },
    };
  }

  throw Error('Unsupported child element vnode type');
}

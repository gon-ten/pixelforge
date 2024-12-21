import {
  type FunctionComponent,
  isValidElement,
  toChildArray,
  VNode,
} from 'preact';
import { hexToRgba } from '../utils/color.ts';
import { FontStyle } from './LoadFont.tsx';
import { readFileBytes } from '../utils/fs.ts';
import { Component, useRenderer } from '../core/render.ts';
import { useLogger } from '../core/hooks.ts';
import { CanvasKit, type TextStyle } from 'canvaskit-wasm';
import merge from 'lodash.merge';

export type TextProps = {
  fontFamily?: string;
  fontSize?: number;
  fontStyle?: FontStyle;
  color?: `#${string}` | [r: number, g: number, b: number, a?: number];
  x?: number;
  y?: number;
  width?: number | `${number}%`;
  align?: 'left' | 'center';
};

export const Parragraph: FunctionComponent<TextProps> = (
  {
    // fontFamily,
    fontSize = 16,
    // fontStyle = FontStyle.Regular,
    x = 0,
    y = 0,
    color = [0, 0, 0],
    width = '100%',
    children,
  },
) => {
  const log = useLogger('Parragraph');

  const renderer = useRenderer({
    name: 'Text',
    render: async ({ canvas, surface, CanvasKit, parentData }) => {
      const renderX = parentData.x + (x ?? 0);
      const renderY = parentData.y + (y ?? 0);

      const typefaceFontManager = CanvasKit.TypefaceFontProvider.Make();
      // TODO: Implement font loading or modify this to use the font manager
      typefaceFontManager.registerFont(
        await readFileBytes('../examples/assets/Roboto-Regular.ttf'),
        'Roboto-Regular',
      );

      const fontCollection = CanvasKit.FontCollection.Make();
      fontCollection.setDefaultFontManager(typefaceFontManager);

      const baseTextStyle: TextStyle = new CanvasKit.TextStyle({
        fontFamilies: ['Roboto-Regular'],
        halfLeading: true,
        fontSize,
        color: CanvasKit.Color(
          ...(typeof color === 'string' ? hexToRgba(color) : color),
        ),
      });

      const parragraphStyle = new CanvasKit.ParagraphStyle(
        {
          textStyle: baseTextStyle,
          textAlign: CanvasKit.TextAlign.Center,
        },
      );

      const parragraphBuilder = CanvasKit.ParagraphBuilder
        .MakeFromFontCollection(
          parragraphStyle,
          fontCollection,
        );

      for (const itemContent of toChildArray(children)) {
        if (typeof itemContent === 'string') {
          parragraphBuilder.addText(itemContent);
        } else if (isValidElement(itemContent)) {
          const partialTextStyle = getFontStyleByVNodeType(
            itemContent,
            CanvasKit,
          );
          parragraphBuilder.pushStyle(
            merge({}, baseTextStyle, partialTextStyle),
          );
          parragraphBuilder.addText(String(itemContent.props.children));
          parragraphBuilder.pop();
        }
      }

      const containerWidth = typeof width === 'string'
        ? (parseInt(width) / 100) * parentData.width
        : width;

      const parragraph = parragraphBuilder.build();
      parragraph.layout(containerWidth);

      canvas.drawParagraph(
        parragraph,
        renderX,
        renderY,
      );

      parragraph.delete();
      typefaceFontManager.delete();
      parragraphBuilder.delete();
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

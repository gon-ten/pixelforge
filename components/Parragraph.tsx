import { Fragment, type FunctionComponent } from 'preact';
import { RenderAck, useLogger, useRenderer } from '../Renderer.tsx';
import { hexToRgba } from '../utils/color.ts';
import { FontStyle } from './LoadFont.tsx';
import { readFileBytes } from '../utils/fs.ts';

export type TextProps = {
  fontFamily?: string;
  fontSize?: number;
  fontStyle?: FontStyle;
  color?: `#${string}` | [r: number, g: number, b: number, a?: number];
  content: string;
  children?: never;
  x?: number;
  y?: number;
  width?: number | `${number}%`;
  align?: 'left' | 'center';
};

export const Parragraph: FunctionComponent<TextProps> = (
  {
    content,
    // fontFamily,
    fontSize = 16,
    // fontStyle = FontStyle.Regular,
    x = 0,
    y = 0,
    color = [0, 0, 0],
    width = '100%',
  },
) => {
  const log = useLogger('Text');

  const { id, ack } = useRenderer({
    name: 'Text',
    renderFn: async ({ canvas, surface, CanvasKit, parentData }) => {
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

      const parragraphStyle = new CanvasKit.ParagraphStyle(
        {
          textStyle: {
            fontFamilies: ['Roboto-Regular'],
            halfLeading: true,
            fontSize,
            color: CanvasKit.Color(
              ...(typeof color === 'string' ? hexToRgba(color) : color),
            ),
          },
          textAlign: CanvasKit.TextAlign.Center,
        },
      );

      const parragraphBuilder = CanvasKit.ParagraphBuilder
        .MakeFromFontCollection(
          parragraphStyle,
          fontCollection,
        );

      parragraphBuilder.addText(content);

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

  return (
    <Fragment>
      <RenderAck id={id} ack={ack} />
    </Fragment>
  );
};

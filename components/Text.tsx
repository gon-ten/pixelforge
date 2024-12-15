import { Fragment, type FunctionComponent } from 'preact';
import {
  RenderAck,
  useFontManager,
  useLogger,
  useRenderer,
} from '../Renderer.tsx';
import { hexToRgba } from '../utils/color.ts';
import { FontStyle } from './LoadFont.tsx';

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

export const Text: FunctionComponent<TextProps> = (
  {
    content,
    fontFamily,
    fontSize = 16,
    fontStyle = FontStyle.Regular,
    x = 0,
    y = 0,
    color = [0, 0, 0],
    width = '100%',
    align = 'left',
  },
) => {
  const log = useLogger('Text');
  const fontManager = useFontManager();

  const { id, ack } = useRenderer({
    name: 'Text',
    renderFn: ({ canvas, surface, CanvasKit, parentData }) => {
      let renderX = parentData.x + (x ?? 0);
      const renderY = parentData.y + (y ?? 0);

      const paint = new CanvasKit.Paint();
      paint.setColor(CanvasKit.Color(
        ...(typeof color === 'string' ? hexToRgba(color) : color),
      ));
      paint.setAntiAlias(true);

      const font = fontManager.use({
        family: fontFamily,
        size: fontSize,
        style: fontStyle,
      });
      const glyphIDs = font.getGlyphIDs(content);
      const glyphBounds = font.getGlyphBounds(glyphIDs, paint);

      let minTop = Infinity;
      for (let i = 0; i < glyphIDs.length; i++) {
        const top = glyphBounds[4 * i + 1]; // [l,t,r,b]
        if (top < minTop) {
          minTop = top;
        }
      }

      const yPosition = renderY - minTop;

      const containerWidth = typeof width === 'string'
        ? (parseInt(width) / 100) * parentData.width
        : width;

      if (align === 'center') {
        const textWidth = font.getGlyphWidths(glyphIDs, paint).reduce(
          (acc, w) => acc + w,
          0,
        );
        renderX += (containerWidth - textWidth) / 2;
      }

      canvas.drawText(
        content,
        renderX,
        yPosition,
        paint,
        font,
      );

      paint.delete();
      surface.flush();
      log('Rendered text at %d %d', renderX, yPosition);
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

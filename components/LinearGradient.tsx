import type { FunctionComponent } from 'preact';
import {
  ParentContext,
  RenderAck,
  useLogger,
  useParent,
  useRenderer,
} from '../Renderer.tsx';
import { hexToRgba } from '../utils/color.ts';

export type LinearGradientProps = {
  x?: number;
  y?: number;
  colors: [
    offset: number,
    color: `#${string}` | [r: number, g: number, b: number, a?: number],
  ][];
  width: number | `${number}%`;
  height: number | `${number}%`;
};

export const LinearGradient: FunctionComponent<LinearGradientProps> = (
  { colors, width, height, x, y, children },
) => {
  const log = useLogger('LinearGradient');

  const parent = useParent();

  const computedWidth = typeof width === 'string'
    ? (parseInt(width) / 100) * parent.width
    : width;

  const computedHeight = typeof height === 'string'
    ? (parseInt(height) / 100) * parent.height
    : height;

  const renderX = parent.x + (x ?? 0);
  const renderY = parent.y + (y ?? 0);

  const { id, getNextParentContext, ack } = useRenderer({
    name: 'LinearGradient',
    renderFn: ({ canvas, surface, CanvasKit }) => {
      const startPoint = [renderX, renderY];
      const endPoint = [renderX + computedWidth, renderY + computedHeight];
      const gradientShader = CanvasKit.Shader.MakeLinearGradient(
        startPoint,
        endPoint,
        colors.map(([, color]) =>
          CanvasKit.Color(
            ...(typeof color === 'string' ? hexToRgba(color) : color),
          )
        ),
        null,
        CanvasKit.TileMode.Clamp,
      );
      const paint = new CanvasKit.Paint();
      paint.setShader(gradientShader);
      paint.setStyle(CanvasKit.PaintStyle.Fill);
      canvas.drawRRect(
        CanvasKit.XYWHRect(renderX, renderY, computedWidth, computedHeight),
        paint,
      );
      paint.delete();
      gradientShader.delete();
      surface.flush();
      log('Rendered linear gradient at %d %d', renderX, renderY);
    },
    resolveNextParentContext({ currentParent }) {
      return {
        x: currentParent.x + (x ?? 0),
        y: currentParent.y + (y ?? 0),
        width: computedWidth,
        height: computedHeight,
      };
    },
  });

  return (
    <ParentContext.Provider
      value={{
        get: getNextParentContext,
      }}
    >
      {children}
      <RenderAck id={id} ack={ack} />
    </ParentContext.Provider>
  );
};

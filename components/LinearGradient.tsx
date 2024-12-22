import type { FunctionComponent } from 'preact';
import { anyColorFormatToColor, ColorValue } from '../utils/color.ts';
import { Component, useRenderer } from '../core/render.ts';
import { useLogger } from '../core/hooks.ts';
import { useParent } from '../core/ParentContext.tsx';

export type LinearGradientProps = {
  x?: number;
  y?: number;
  colors: [
    offset: number,
    color: ColorValue,
  ][];
  width: number | `${number}%`;
  height: number | `${number}%`;
};

export const LinearGradient: FunctionComponent<LinearGradientProps> = (
  { colors, width, height, x, y, children },
) => {
  const log = useLogger('LinearGradient');

  const parent = useParent().get();

  const computedWidth = typeof width === 'string'
    ? (parseInt(width) / 100) * parent.width
    : width;

  const computedHeight = typeof height === 'string'
    ? (parseInt(height) / 100) * parent.height
    : height;

  const renderX = parent.x + (x ?? 0);
  const renderY = parent.y + (y ?? 0);

  const renderer = useRenderer({
    name: 'LinearGradient',
    render: ({ canvas, surface, CanvasKit }) => {
      const startPoint = [renderX, renderY];
      const endPoint = [renderX + computedWidth, renderY + computedHeight];
      const gradientShader = CanvasKit.Shader.MakeLinearGradient(
        startPoint,
        endPoint,
        colors.map(([, color]) =>
          CanvasKit.Color(
            ...anyColorFormatToColor(color),
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

  return <Component {...renderer}>{children}</Component>;
};

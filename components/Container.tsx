import type { FunctionComponent } from 'preact';
import {
  colorStringToRgbaColor,
  HexColorString,
  RgbaColor,
  RgbaColorString,
  rgbaColorStringToRgbaColor,
} from '../utils/color.ts';
import { Component, useRenderer } from '../core/render.ts';
import { useLogger } from '../core/hooks.ts';
import { useParent } from '../core/ParentContext.tsx';

type SizeProps = {
  width: number | `${number}%`;
  height: number | `${number}%`;
} | {
  size: number;
};

export type ContainerProps =
  & {
    x?: number;
    y?: number;
    borderRadius?: number | [x: number, y: number];
    shadow?: {
      sigma?: number;
      color: RgbaColorString | RgbaColor;
    };
    overflow?: 'hidden' | 'visible';
    backgroundColor?: RgbaColorString | RgbaColor | HexColorString;
  }
  & SizeProps;

type LocalState = {
  savingPoint?: number;
};

export const Container: FunctionComponent<ContainerProps> = (
  {
    x = 0,
    y = 0,
    children,
    borderRadius,
    shadow,
    backgroundColor,
    overflow = 'visible',
    ...otherProps
  },
) => {
  const log = useLogger('Container');
  const { width, height } = getDimensionsFromSizeProps(otherProps);

  const parent = useParent().get();

  const renderY = parent.y + y;
  const renderX = parent.x + x;

  const computedWidth = typeof width === 'string'
    ? (parseInt(width) / 100) * parent.width
    : width;
  const computedHeight = typeof height === 'string'
    ? (parseInt(height) / 100) * parent.height
    : height;

  const renderer = useRenderer<LocalState>({
    name: 'Container',
    afterRender({ canvas, state }) {
      if (typeof state.savingPoint !== 'undefined') {
        canvas.restoreToCount(state.savingPoint);
        log('Restored to count %d', state.savingPoint);
      }
    },
    render({ canvas, CanvasKit, state }) {
      const [rx, ry] = Array.isArray(borderRadius)
        ? borderRadius
        : [borderRadius, borderRadius];

      const rect = CanvasKit.RRectXY(
        CanvasKit.XYWHRect(renderX, renderY, computedWidth, computedHeight),
        rx ?? 0,
        ry ?? 0,
      );

      if (shadow) {
        const shadowColor = typeof shadow.color === 'string'
          ? rgbaColorStringToRgbaColor(shadow.color)
          : shadow.color;
        const shadowPaint = new CanvasKit.Paint();
        shadowPaint.setColor(CanvasKit.Color(...shadowColor));
        shadowPaint.setMaskFilter(
          CanvasKit.MaskFilter.MakeBlur(
            CanvasKit.BlurStyle.Normal,
            shadow.sigma ?? 10,
            true,
          ),
        );
        shadowPaint.setAntiAlias(true);

        canvas.drawRRect(
          rect,
          shadowPaint,
        );

        shadowPaint.delete();
      }

      if (overflow === 'hidden') {
        state.savingPoint = canvas.save();
        log('Saved count %d', state.savingPoint);
        canvas.clipRRect(
          rect,
          CanvasKit.ClipOp.Intersect,
          true,
        );
      }

      if (backgroundColor) {
        const color = typeof backgroundColor === 'string'
          ? colorStringToRgbaColor(backgroundColor)
          : backgroundColor;
        const paint = new CanvasKit.Paint();
        paint.setColor(CanvasKit.Color(...color));
        paint.setAntiAlias(true);
        canvas.drawRRect(rect, paint);
        paint.delete();
      }

      log('Rendered Container at %d %d', renderX, renderY);
    },
    resolveNextParentContext() {
      return {
        x: renderX,
        y: renderY,
        width: computedWidth,
        height: computedHeight,
      };
    },
  });

  return <Component {...renderer}>{children}</Component>;
};

function getDimensionsFromSizeProps(sizeProps: SizeProps) {
  if ('size' in sizeProps) {
    return { width: sizeProps.size, height: sizeProps.size };
  }
  return sizeProps;
}

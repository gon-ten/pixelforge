import type { FunctionComponent } from 'preact';
import {
  ParentContext,
  RenderAck,
  useLogger,
  useParent,
  useRenderer,
} from '../Renderer.tsx';

type SizeProps = {
  width: number;
  height: number;
} | {
  size: number;
};

export type ClipRectProps =
  & {
    x?: number;
    y?: number;
    borderRadius?: number | [x: number, y: number];
  }
  & SizeProps;

type LocalState = {
  savingPoint: number;
};

export const ClipRect: FunctionComponent<ClipRectProps> = (
  { x = 0, y = 0, children, borderRadius, ...otherProps },
) => {
  const log = useLogger('ClipRect');
  const { width, height } = getDimensionsFromSizeProps(otherProps);

  const parent = useParent();

  const renderY = parent.y + y;
  const renderX = parent.x + x;

  const { id, getNextParentContext, ack } = useRenderer<LocalState>({
    name: 'ClipRect',
    afterRender({ canvas, state }) {
      canvas.restoreToCount(state.savingPoint);
      log('Restored to count %d', state.savingPoint);
    },
    renderFn({ canvas, CanvasKit, state }) {
      const [rx, ry] = Array.isArray(borderRadius)
        ? borderRadius
        : [borderRadius, borderRadius];
      state.savingPoint = canvas.save();
      log('Saved count %d', state.savingPoint);

      const rect = CanvasKit.RRectXY(
        CanvasKit.XYWHRect(renderX, renderY, width, height),
        rx ?? 0,
        ry ?? 0,
      );

      canvas.clipRRect(
        rect,
        CanvasKit.ClipOp.Intersect,
        true,
      );
      log('Clipped to rect %d %d %d %d', renderX, renderY, width, height);
    },
    resolveNextParentContext() {
      return {
        x: renderX,
        y: renderY,
        width,
        height,
      };
    },
  });

  return (
    <ParentContext.Provider value={{ get: getNextParentContext }}>
      {children}
      <RenderAck id={id} ack={ack} />
    </ParentContext.Provider>
  );
};

function getDimensionsFromSizeProps(sizeProps: SizeProps) {
  if ('size' in sizeProps) {
    return { width: sizeProps.size, height: sizeProps.size };
  }
  return sizeProps;
}

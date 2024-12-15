import type { FunctionComponent } from 'preact';
import {
  type MandatoryProps,
  ParentContext,
  RenderAck,
  useLogger,
  useRenderer,
} from '../Renderer.tsx';
import { loadAsset } from '../utils/load_asset.ts';

export type PictureProps = MandatoryProps & {
  region?: [x: number, y: number, width: number, height: number];
  src: string | Uint8Array;
};

type LocalState = {
  computedWidth: number;
  computedHeight: number;
};

export const Picture: FunctionComponent<PictureProps> = (
  { x = 0, y = 0, children, src, region, width, height },
) => {
  const log = useLogger('Picture');

  const { getNextParentContext, ack, id } = useRenderer<
    LocalState,
    Uint8Array
  >({
    name: 'Picture',
    async loader() {
      if (typeof src === 'string') {
        const result = await loadAsset(src);
        log('Loaded asset %s', src);
        return result;
      }
      return src;
    },
    renderFn: ({ CanvasKit, canvas, surface, data, parentData, state }) => {
      const renderX = parentData.x + x;
      const renderY = parentData.y + y;

      const patternImage = CanvasKit.MakeImageFromEncoded(data);

      if (!patternImage) {
        throw Error('Failed to create image');
      }

      const paint = new CanvasKit.Paint();
      paint.setAntiAlias(true);

      const clipRect = region
        ? region
        : [0, 0, patternImage.width(), patternImage.height()];

      const computedWidth = width ?? clipRect[2] - clipRect[0];
      const computedHeight = height ?? clipRect[3] - clipRect[1];

      state.computedWidth = computedWidth;
      state.computedHeight = computedHeight;

      canvas.drawImageRect(
        patternImage,
        clipRect,
        [
          renderX,
          renderY,
          renderX + computedWidth,
          renderY + computedHeight,
        ],
        paint,
      );

      paint.delete();
      patternImage.delete();
      surface.flush();
      log('Rendered image at %d %d', renderX, renderY);
    },
    resolveNextParentContext({ currentParent, state }) {
      return {
        x: currentParent.x + x,
        y: currentParent.y + y,
        width: state.computedWidth,
        height: state.computedHeight,
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

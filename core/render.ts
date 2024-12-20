import type { Canvas, CanvasKit, Surface } from 'canvaskit-wasm';
import { noop } from '../utils/noop.ts';
import { once } from '../utils/once.ts';
import { useId, useRef } from 'preact/hooks';
import { ParentContext, type ParentData, useParent } from './ParentContext.tsx';
import { RenderAck, useRenderingContext } from '../Renderer.tsx';
import {
  FontManager,
  useFontManager,
  useOptionalStableCallback,
  useStableCallback,
} from './hooks.ts';
import { FunctionComponent, h } from 'preact';

type RenderArgs<
  State extends Record<string, unknown> = Record<string, unknown>,
  Data extends unknown = unknown,
> = {
  data: Data;
  canvas: Canvas;
  surface: Surface;
  CanvasKit: CanvasKit;
  parentData: ParentData;
  state: State;
  fontManager: FontManager;
};

export type AfterRenderHook<
  State extends Record<string, unknown> = Record<string, unknown>,
  Data extends unknown = unknown,
> = (
  args: RenderArgs<State, Data>,
) => void;

export type RenderFunction<
  State extends Record<string, unknown> = Record<string, unknown>,
  Data extends unknown = unknown,
> = (
  args: RenderArgs<State, Data>,
) => Promise<void> | void;

type LoaderFunction<Data> = () => Promise<Data>;

type ResolveParentContextFunction<State, Data> = (
  args: { data: Data; currentParent: ParentData; state: State },
) => ParentData;

export type UseRendererArgs<
  State extends Record<string, unknown> = Record<string, unknown>,
  Data extends unknown = unknown,
> = {
  name: string;
  render: RenderFunction<State, Data>;
  loader?: LoaderFunction<Data>;
  resolveNextParentContext: ResolveParentContextFunction<State, Data>;
  afterRender?: AfterRenderHook<State, Data>;
};

export type UseRendererReturnValue = {
  id: string;
  ack: () => null;
  getNextParentContext: () => ParentData;
};

export const useRenderer = <
  State extends Record<string, unknown> = Record<string, unknown>,
  Data extends unknown = unknown,
>(args: UseRendererArgs<State, Data>): UseRendererReturnValue => {
  const {
    name,
    render,
    resolveNextParentContext,
    loader = noop,
    afterRender = noop,
  } = args;
  const id = useId();
  const fontManager = useFontManager();
  const parent = useParent();
  const renderFnStable = useStableCallback(render);
  const { wg, stack, canvas, surface, CanvasKit } = useRenderingContext();
  const stableLoader = useStableCallback(loader as LoaderFunction<Data>);

  const stableAfterRender = useOptionalStableCallback(afterRender);

  const getNextParentContext = useRef(resolveNextParentContext);
  getNextParentContext.current = resolveNextParentContext;

  const stableGetNextParentContext = useRef(() =>
    getNextParentContext.current({
      data: dataRef.current as Data,
      currentParent: parent.get(),
      state: state.current,
    })
  );

  const state = useRef<State>({} as State);

  const dataRef = useRef<Data | undefined>(undefined);

  const pushStack = useRef(
    once(() => {
      wg.add(1);
      stack.push([id, name + ' Render', async () => {
        const data = await stableLoader();

        dataRef.current = data;

        await Promise.resolve().then(
          () =>
            renderFnStable({
              canvas,
              surface,
              CanvasKit,
              data: data as Data,
              parentData: parent.get(),
              state: state.current,
              fontManager,
            }),
        );
      }]);
    }),
  );

  pushStack.current();

  const stableAck = useRef(once(() => {
    stack.push([id, name + ' AfterRender', () => {
      stableAfterRender({
        canvas,
        surface,
        CanvasKit,
        data: dataRef.current as Data,
        parentData: parent.get(),
        state: state.current,
        fontManager,
      });
    }]);
    wg.done();
    return null;
  }));

  return {
    id,
    ack: stableAck.current,
    getNextParentContext: stableGetNextParentContext.current,
  };
};

// deno-lint-ignore ban-types
type ComponentProps = UseRendererReturnValue & {};

export const Component: FunctionComponent<ComponentProps> = (props) => {
  return h(
    ParentContext.Provider,
    {
      value: {
        get: props.getNextParentContext,
      },
    },
    [
      props.children,
      h(RenderAck, { id: props.id, ack: props.ack }),
    ],
  );
};

import { createContext, type FunctionComponent } from 'preact';
import { useContext, useRef } from 'preact/hooks';
import { FontStyle } from '../components/LoadFont.tsx';
import { PartialDeep } from './types.ts';
import merge from 'lodash.merge';
import { ColorValue } from '../utils/color.ts';

export type ContextValue = {
  textStyle: {
    fontFamily: string | string[];
    fontSize: number;
    fontStyle: FontStyle;
    color: ColorValue;
    align: 'left' | 'center';
  };
};

const DefaultsContext = createContext<ContextValue | null>(null);

export const useDefaults = () => {
  const ctx = useContext(DefaultsContext);
  if (!ctx) {
    throw Error('DefaultsContext is not provided');
  }
  return ctx;
};

export type DefaultsProvider = {
  initialValues?: PartialDeep<ContextValue>;
};

export const DefaultsProvider: FunctionComponent<DefaultsProvider> = (
  { children, initialValues = {} },
) => {
  const defaults = useRef<ContextValue>(
    merge(
      {},
      {
        textStyle: {
          fontFamily: ['NotoSans', 'NotoColorEmoji'],
          fontSize: 16,
          fontStyle: FontStyle.Regular,
          color: '#FFF',
          align: 'left',
        },
      },
      initialValues,
    ),
  );

  return (
    <DefaultsContext.Provider value={defaults.current}>
      {children}
    </DefaultsContext.Provider>
  );
};

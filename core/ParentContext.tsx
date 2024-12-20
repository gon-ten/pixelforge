import { createContext } from 'preact';
import { useContext } from 'preact/hooks';

export type ParentData = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ParentContextValue = {
  get: () => ParentData;
};

export const ParentContext = createContext<
  ParentContextValue | null
>(null);

export const useParent = () => {
  const ctx = useContext(ParentContext);
  if (!ctx) {
    throw Error('ParentContext is not provided');
  }
  return ctx;
};

import React, {
  DependencyList,
  EffectCallback,
  useEffect,
  useRef,
} from "react";

export const useNoInitialEffect = (
  effect: EffectCallback,
  deps: DependencyList
) => {
  const initial = React.useRef(true);
  useEffect(() => {
    if (initial.current) {
      initial.current = false;
      return;
    }
    return effect();
  }, deps);
};

export function useIsFirstRender(): boolean {
  const isFirst = useRef(true);

  useEffect(() => {
    isFirst.current = false;
  }, []);

  return isFirst.current;
}

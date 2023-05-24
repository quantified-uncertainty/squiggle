import {
  createContext,
  FC,
  PropsWithChildren,
  Reducer,
  startTransition,
  useContext,
  useReducer,
} from "react";

export function generateProvider<Shape extends {}, Action extends {}>({
  defaultValue,
  reducer,
  name,
}: {
  defaultValue: Shape;
  reducer: Reducer<Shape, Action>;
  name: string;
}) {
  const Context = createContext<Shape>(defaultValue);

  const DispatchContext = createContext<(action: Action) => void>(() => {});

  const useShapeContext = () => {
    return useContext(Context);
  };

  const useShapeDispatch = () => {
    return useContext(DispatchContext);
  };

  const Provider: FC<PropsWithChildren<{ generateInitialValue(): Shape }>> = ({
    children,
    generateInitialValue,
  }) => {
    // TODO - when clusters change (e.g. when we update the underlying model), we should update the state
    const [state, dispatch] = useReducer(
      reducer,
      undefined,
      generateInitialValue
    );

    const transitionDispatch = (action: Action) => {
      startTransition(() => {
        dispatch(action);
      });
    };

    return (
      <Context.Provider value={state}>
        <DispatchContext.Provider value={transitionDispatch}>
          {children}
        </DispatchContext.Provider>
      </Context.Provider>
    );
  };
  Provider.displayName = `${name}Provider`;

  return {
    useContext: useShapeContext,
    useDispatch: useShapeDispatch,
    Provider,
  };
}

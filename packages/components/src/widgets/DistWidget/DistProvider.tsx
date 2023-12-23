import { Reducer } from "react";

import { generateProvider } from "@quri/ui";

type State = {
  verticalLine?: number;
};

type Action = {
  type: "SET_VERTICAL_LINE";
  payload: number | undefined;
};

const defaultValue = {};

const reducer: Reducer<State, Action> = (state, { type, payload }) => {
  switch (type) {
    case "SET_VERTICAL_LINE":
      return {
        ...state,
        verticalLine: payload,
      };
    default:
      return state;
  }
};

const {
  Provider,
  useContext: useDistContext,
  useDispatch: useDistDispatch,
} = generateProvider<State, Action>({
  name: "Dist",
  reducer,
  defaultValue,
});

export function useGetSelectedVerticalLine() {
  const { verticalLine } = useDistContext();

  return verticalLine;
}

export const DistProvider = Provider;

export function useSetSelectedVerticalLine() {
  const dispatch = useDistDispatch();

  return (value: number | undefined) =>
    dispatch({ type: "SET_VERTICAL_LINE", payload: value });
}

"use client";
import {
  FC,
  PropsWithChildren,
  Reducer,
  createContext,
  useCallback,
  useContext,
  useReducer,
} from "react";
import { clsx } from "clsx";
import { ErrorIcon } from "../../icons/ErrorIcon.js";
import { CheckCircleIcon } from "../../icons/CheckCircleIcon.js";

type ToastShape = {
  text: string;
  type: "confirmation" | "error";
  id: string;
};

type State = {
  toasts: ToastShape[];
};

type Action =
  | {
      type: "ADD_TOAST";
      payload: ToastShape;
    }
  | {
      type: "REMOVE_TOAST";
      payload: string;
    };

const reducer: Reducer<State, Action> = (state, action) => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [...state.toasts, action.payload],
      };
    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((toast) => toast.id !== action.payload),
      };
    default:
      return state;
  }
};

const Toast: FC<{ toast: ToastShape }> = ({ toast }) => {
  const dispatch = useContext(Context);

  const remove = () => {
    dispatch({
      type: "REMOVE_TOAST",
      payload: toast.id,
    });
  };

  return (
    <div
      className={clsx(
        "flex items-center gap-2",
        "border px-8 py-4 bg-white rounded text-sm cursor-pointer shadow-lg",
        toast.type === "error" && "text-red-700",
        toast.type === "confirmation" && "text-slate-700"
      )}
      onClick={remove}
    >
      {toast.type === "error" && <ErrorIcon size={16} />}
      {toast.type === "confirmation" && <CheckCircleIcon size={16} />}
      <div>{toast.text}</div>
    </div>
  );
};

const Context = createContext<(action: Action) => void>(() => undefined);

export const useToast = () => {
  const dispatch = useContext(Context);

  return useCallback(
    (text: string, type: ToastShape["type"]) => {
      dispatch({
        type: "ADD_TOAST",
        payload: {
          text,
          type,
          id: Math.random().toString(36).slice(2),
        },
      });
    },
    [dispatch]
  );
};

export const WithToasts: FC<PropsWithChildren> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, { toasts: [] });
  return (
    <Context.Provider value={dispatch}>
      <div>{children}</div>
      <div className="fixed right-4 bottom-4 space-y-2 z-50">
        {state.toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </div>
    </Context.Provider>
  );
};

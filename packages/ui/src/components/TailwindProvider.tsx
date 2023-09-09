"use client";
import { FC, PropsWithChildren, createContext } from "react";

type TailwindContextShape = {
  selector?: string;
};

export const TailwindContext = createContext<TailwindContextShape>({
  selector: undefined,
});

export const TailwindProvider: FC<PropsWithChildren<{ selector?: string }>> = ({
  selector = "squiggle", // recommended name in squiggle-components README.md
  children,
}) => {
  return (
    <TailwindContext.Provider value={{ selector }}>
      <div className={selector}>{children}</div>
    </TailwindContext.Provider>
  );
};

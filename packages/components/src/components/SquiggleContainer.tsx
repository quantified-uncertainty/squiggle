import React, { useContext } from "react";

type Props = {
  children: React.ReactNode;
};

type SquiggleContextShape = {
  containerized: boolean;
};
const SquiggleContext = React.createContext<SquiggleContextShape>({
  containerized: false,
});

export const SquiggleContainer: React.FC<Props> = ({ children }) => {
  const context = useContext(SquiggleContext);
  if (context.containerized) {
    return <>{children}</>;
  } else {
    return (
      <SquiggleContext.Provider value={{ containerized: true }}>
        <div className="squiggle">{children}</div>
      </SquiggleContext.Provider>
    );
  }
};

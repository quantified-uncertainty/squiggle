import { FC, useEffect, useRef } from "react";
import mermaid from "mermaid";

type Props = {
  children: string;
};

const Mermaid: FC<Props> = ({ children }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) {
      return;
    }
    mermaid.run({
      nodes: [ref.current],
    });
  }, []);

  return (
    <div className="mermaid text-center" ref={ref}>
      {children}
    </div>
  );
};

export default Mermaid; // default export, because this component is lazy-loaded

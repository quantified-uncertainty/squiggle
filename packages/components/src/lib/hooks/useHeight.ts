import { useEffect, useRef, useState } from "react";

export const useHeight = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
        console.log(ref.current, ref.current.offsetHeight)
      setHeight(ref.current.offsetHeight);
    }
  }, []); // Empty array means this effect runs once when the component mounts

  return { ref, height };
};

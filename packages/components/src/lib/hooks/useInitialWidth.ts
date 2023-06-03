import { useEffect, useRef, useState } from "react";

export const useInitialWidth = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (ref.current) {
      setWidth(ref.current.offsetWidth);
    }
  }, []); // Empty array means this effect runs once when the component mounts

  return { ref, width };
};
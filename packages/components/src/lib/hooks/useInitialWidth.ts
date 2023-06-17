import { useEffect, useRef, useState } from "react";

export function useInitialWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | undefined>();

  useEffect(() => {
    if (ref.current) {
      setWidth(ref.current.offsetWidth);
    }
  }, []); // Empty array means this effect runs once when the component mounts

  return { ref, width };
}

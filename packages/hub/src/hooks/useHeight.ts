import { useEffect, useRef, useState } from "react";

export const useHeight = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const updateHeight = () => {
      if (ref.current) {
        setHeight(ref.current.offsetHeight);
      }
    }

    // Call it right away
    updateHeight();

    // Call it when window resizes
    window.addEventListener('resize', updateHeight);

    // Cleanup function
    return () => {
      window.removeEventListener('resize', updateHeight);
    }
  }, []); // Empty array means this effect runs once when the component mounts

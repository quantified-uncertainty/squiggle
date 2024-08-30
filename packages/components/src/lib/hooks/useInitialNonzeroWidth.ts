import { useEffect, useRef, useState } from "react";

// This hook is used to get the initial width of a component.
// It's useful for getting the initial width of a component that is not rendered immediately.
// For example, the playground uses this to get the initial width of the container.
export function useInitialNonzeroWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | undefined>();

  useEffect(() => {
    const updateWidth = () => {
      if (ref.current) {
        const currentWidth = ref.current.offsetWidth;
        if (currentWidth > 0) {
          setWidth(currentWidth);
          return true;
        }
      }
      return false;
    };

    if (!updateWidth()) {
      const intervalId = setInterval(() => {
        if (updateWidth()) {
          clearInterval(intervalId);
        }
      }, 100);

      return () => clearInterval(intervalId);
    }
  }, []);

  return { ref, width };
}

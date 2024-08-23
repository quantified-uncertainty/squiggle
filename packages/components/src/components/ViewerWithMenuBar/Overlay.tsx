import { FC, useEffect, useState } from "react";

export const Overlay: FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setShow(true), 50);
    return () => clearTimeout(id);
  }, []);

  return show ? (
    <div className="absolute inset-0 z-10 bg-white opacity-50" />
  ) : null;
};

import { useEffect, useState } from "react";
import { ArrowPathIcon } from "@heroicons/react/20/solid";
import styles from "./FallbackSpinner.module.css";

export const FallbackSpinner = ({ height }) => {
  const [show, setShow] = useState(/* false */ true);
  useEffect(() => {
    setTimeout(() => {
      setShow(true);
    }, 500);
  }, []);
  return (
    <div className={styles.container} style={{ height }}>
      {show ? <ArrowPathIcon className={styles.icon} /> : null}
    </div>
  );
};

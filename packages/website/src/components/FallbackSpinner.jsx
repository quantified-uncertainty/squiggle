import { useEffect, useState } from "react";
import { RefreshIcon } from "@heroicons/react/solid";
import styles from "./FallbackSpinner.module.css";

export const FallbackSpinner = ({ height }) => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      setShow(true);
    }, 500);
  }, []);
  return (
    <div className={styles.container} style={{ height }}>
      {show ? <RefreshIcon className={styles.icon} /> : null}
    </div>
  );
};

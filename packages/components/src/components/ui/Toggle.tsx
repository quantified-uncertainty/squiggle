import clsx from "clsx";
import { motion } from "framer-motion";
import React from "react";

type IconType = (props: React.ComponentProps<"svg">) => JSX.Element;

type Props = {
  status: boolean;
  onChange: (status: boolean) => void;
  texts: [string, string];
  icons: [IconType, IconType];
};

export const Toggle: React.FC<Props> = ({
  texts: [onText, offText],
  icons: [OnIcon, OffIcon],
  status,
  onChange,
}) => {
  const CurrentIcon = status ? OnIcon : OffIcon;
  return (
    <motion.button
      layout
      transition={{ duration: 0.2 }}
      className={clsx(
        "rounded-full py-1 bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1",
        status ? "bg-indigo-500" : "bg-gray-400",
        status ? "pl-1 pr-3" : "pl-3 pr-1",
        !status && "flex-row-reverse space-x-reverse"
      )}
      onClick={() => onChange(!status)}
    >
      <motion.div layout transition={{ duration: 0.2 }}>
        <CurrentIcon className="w-6 h-6" />
      </motion.div>
      <motion.span layout transition={{ duration: 0.2 }}>
        {status ? onText : offText}
      </motion.span>
    </motion.button>
  );
};

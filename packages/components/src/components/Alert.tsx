import * as React from "react";
import {
  CheckCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from "@heroicons/react/solid/esm/index.js";
import { clsx } from "clsx";

export const Alert: React.FC<{
  heading: string;
  backgroundColor: string;
  headingColor: string;
  bodyColor: string;
  icon: (props: React.ComponentProps<"svg">) => JSX.Element;
  iconColor: string;
  children?: React.ReactNode;
}> = ({
  heading = "Error",
  backgroundColor,
  headingColor,
  bodyColor,
  icon: Icon,
  iconColor,
  children,
}) => {
  return (
    <div
      className={clsx("rounded-sm px-3 py-2", backgroundColor)}
      role="status"
    >
      <div className="flex">
        <Icon
          className={clsx("h-5 w-5 flex-shrink-0", iconColor)}
          aria-hidden="true"
        />
        <div className="ml-3 grow">
          <header className={clsx("text-sm font-medium", headingColor)}>
            {heading}
          </header>
          {children && React.Children.count(children) ? (
            <div className={clsx("mt-2 text-sm", bodyColor)}>{children}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export const ErrorAlert: React.FC<{
  heading: string;
  children?: React.ReactNode;
}> = (props) => (
  <Alert
    {...props}
    backgroundColor="bg-red-100"
    headingColor="text-red-800"
    bodyColor="text-red-700"
    icon={XCircleIcon}
    iconColor="text-red-400"
  />
);

export const MessageAlert: React.FC<{
  heading: string;
  children?: React.ReactNode;
}> = (props) => (
  <Alert
    {...props}
    backgroundColor="bg-slate-100"
    headingColor="text-slate-800"
    bodyColor="text-slate-700"
    icon={InformationCircleIcon}
    iconColor="text-slate-400"
  />
);

export const SuccessAlert: React.FC<{
  heading: string;
  children?: React.ReactNode;
}> = (props) => (
  <Alert
    {...props}
    backgroundColor="bg-green-50"
    headingColor="text-green-800"
    bodyColor="text-green-700"
    icon={CheckCircleIcon}
    iconColor="text-green-400"
  />
);

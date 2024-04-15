import {
  CheckCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from "@heroicons/react/solid/esm/index.js";
import { clsx } from "clsx";
import * as React from "react";

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
      className={clsx("rounded-sm px-2 py-1.5", backgroundColor)}
      role="status"
    >
      <div className="flex">
        <Icon
          className={clsx("h-4 w-4 flex-shrink-0 mt-1 ml-1", iconColor)}
          aria-hidden="true"
        />
        <div className="ml-3 grow">
          <header className={clsx("text-sm font-medium", headingColor)}>
            {heading}
          </header>
          {children && React.Children.count(children) ? (
            <div className={clsx("mt-1 text-sm", bodyColor)}>{children}</div>
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
    backgroundColor="bg-red-50"
    headingColor="text-red-900"
    bodyColor="text-slate-700"
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
    backgroundColor="bg-slate-50"
    headingColor="text-slate-700"
    bodyColor="text-slate-600"
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
    backgroundColor="bg-emerald-50"
    headingColor="text-emerald-800"
    bodyColor="text-emerald-700"
    icon={CheckCircleIcon}
    iconColor="text-emerald-400"
  />
);

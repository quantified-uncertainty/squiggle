import {
  CheckCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from "@heroicons/react/solid/esm/index.js";
import { clsx } from "clsx";
import * as AlertConstants from './AlertConstants';
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
      className={clsx(`rounded-sm ${AlertConstants.PADDING_X} ${AlertConstants.PADDING_Y}`, backgroundColor)}
      role="status"
    >
      <div className="flex">
        <Icon
          className={clsx(`${AlertConstants.HEIGHT} ${AlertConstants.WIDTH} flex-shrink-0 ${AlertConstants.MARGIN_TOP} ml-1`, iconColor)}
          aria-hidden="true"
        />
        <div className="ml-3 grow">
          <header className={clsx(`${AlertConstants.TEXT_SMALL} font-medium`, headingColor)}>
            {heading}
          </header>
          {children && React.Children.count(children) ? (
            <div className={clsx(`${AlertConstants.MARGIN_TOP} ${AlertConstants.TEXT_SMALL}`, bodyColor)}>{children}</div>
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
    backgroundColor="bg-green-50"
    headingColor="text-green-800"
    bodyColor="text-green-700"
    icon={CheckCircleIcon}
    iconColor="text-green-400"
  />
);

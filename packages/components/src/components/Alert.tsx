import * as React from "react";
import {
  XCircleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/solid";

export const Alert: React.FC<{
  heading: string;
  backgroundColor: string;
  headingColor: string;
  bodyColor: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({
  heading = "Error",
  backgroundColor,
  headingColor,
  bodyColor,
  icon,
  children,
}) => {
  return (
    <div className={`rounded-md p-4 ${backgroundColor}`}>
      <div className="flex">
        <div className="flex-shrink-0">{icon}</div>
        <div className="ml-3">
          <h3 className={`text-sm font-medium ${headingColor}`}>{heading}</h3>
          <div className={`mt-2 text-sm ${bodyColor}`}>{children}</div>
        </div>
      </div>
    </div>
  );
};

export const ErrorAlert: React.FC<{
  heading: string;
  children: React.ReactNode;
}> = ({ heading = "Error", children }) => (
  <Alert
    heading={heading}
    children={children}
    backgroundColor="bg-red-100"
    headingColor="text-red-800"
    bodyColor="text-red-700"
    icon={<XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />}
  />
);

export const MessageAlert: React.FC<{
  heading: string;
  children: React.ReactNode;
}> = ({ heading = "Error", children }) => (
  <Alert
    heading={heading}
    children={children}
    backgroundColor="bg-slate-100"
    headingColor="text-slate-700"
    bodyColor="text-slate-700"
    icon={
      <InformationCircleIcon
        className="h-5 w-5 text-slate-400"
        aria-hidden="true"
      />
    }
  />
);

export const SuccessAlert: React.FC<{
  heading: string;
  children: React.ReactNode;
}> = ({ heading = "Error", children }) => (
  <Alert
    heading={heading}
    children={children}
    backgroundColor="bg-green-50"
    headingColor="text-green-800"
    bodyColor="text-green-700"
    icon={
      <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
    }
  />
);

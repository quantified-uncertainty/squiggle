import * as React from "react";
import { XCircleIcon } from "@heroicons/react/solid";

export const ErrorBox: React.FC<{
  heading: string;
  children: React.ReactNode;
}> = ({ heading = "Error", children }) => {
  return (
    <div className="rounded-md bg-red-100 p-4 m-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">{heading}</h3>
          <div className="mt-2 text-sm text-red-700">{children}</div>
        </div>
      </div>
    </div>
  );
};
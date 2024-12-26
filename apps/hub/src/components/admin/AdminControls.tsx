"use client";
import clsx from "clsx";
import { FC, use } from "react";

import { FireIcon, useToast } from "@quri/ui";

import { AdminContext } from "./AdminProvider";

const InnerAdminControls: FC = () => {
  const { isAdminMode, setIsAdminMode } = use(AdminContext);
  const toast = useToast();

  const toggleAdminMode = () => {
    setIsAdminMode(!isAdminMode);
    toast(
      "Admin mode " + (isAdminMode ? "disabled" : "enabled"),
      "confirmation"
    );
  };

  return (
    <div>
      <FireIcon
        className={clsx(
          "h-6 w-6 cursor-pointer",
          isAdminMode ? "text-red-500" : "text-gray-500"
        )}
        onClick={toggleAdminMode}
      />
    </div>
  );
};

export const AdminControls: FC = () => {
  const { isAdmin } = use(AdminContext);

  if (!isAdmin) {
    return null;
  }

  return <InnerAdminControls />;
};

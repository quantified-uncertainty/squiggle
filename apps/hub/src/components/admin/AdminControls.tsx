"use client";
import clsx from "clsx";
import { FC, use } from "react";

import {
  CheckCircleIcon,
  Dropdown,
  DropdownMenu,
  DropdownMenuActionItem,
  EmptyIcon,
  ExternalLinkIcon,
  FireIcon,
  useToast,
} from "@quri/ui";

import { evaluationsRoute } from "@/lib/routes";

import { DropdownMenuNextLinkItem } from "../ui/DropdownMenuNextLinkItem";
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
    <Dropdown
      render={({ close }) => (
        <DropdownMenu>
          <DropdownMenuActionItem
            icon={isAdminMode ? CheckCircleIcon : EmptyIcon}
            onClick={() => {
              toggleAdminMode();
              close();
            }}
            title="Admin Mode"
          />
          <DropdownMenuNextLinkItem
            href="/admin"
            icon={ExternalLinkIcon}
            title="Admin Console"
            close={close}
          />
          <DropdownMenuNextLinkItem
            href={evaluationsRoute()}
            icon={ExternalLinkIcon}
            title="Evals"
            close={close}
          />
        </DropdownMenu>
      )}
    >
      <FireIcon
        className={clsx(
          "h-6 w-6 cursor-pointer",
          isAdminMode ? "text-red-500" : "text-gray-500"
        )}
      />
    </Dropdown>
  );
};

export const AdminControls: FC = () => {
  const { isAdmin } = use(AdminContext);

  if (!isAdmin) {
    return null;
  }

  return <InnerAdminControls />;
};

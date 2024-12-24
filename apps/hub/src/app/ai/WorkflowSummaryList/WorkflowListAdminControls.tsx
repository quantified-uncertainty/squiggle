import { useSearchParams } from "next/navigation";
import { FC, use } from "react";

import { Button, FireIcon } from "@quri/ui";

import { AdminContext } from "@/components/admin/AdminProvider";
import { useUpdateSearchParams } from "@/lib/hooks/useUpdateSearchParams";

export const WorkflowListAdminControls: FC = () => {
  const { isAdminMode } = use(AdminContext);
  const updateSearchParams = useUpdateSearchParams();
  const searchParams = useSearchParams();

  if (!isAdminMode) {
    return null;
  }

  return searchParams.get("allUsers") ? (
    <Button
      size="small"
      onClick={() =>
        updateSearchParams((params) => {
          params.delete("allUsers");
          return params;
        })
      }
    >
      <FireIcon className="h-4 w-4 text-red-500" />
      Show my
    </Button>
  ) : (
    <Button
      size="small"
      onClick={() =>
        updateSearchParams((params) => {
          params.set("allUsers", "true");
          return params;
        })
      }
    >
      <FireIcon className="h-4 w-4 text-red-500" />
      Show all
    </Button>
  );
};

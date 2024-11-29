"use client";

import clsx from "clsx";
import { format } from "date-fns";
import { usePathname } from "next/navigation";
import { FC } from "react";
import { FaClock, FaMinusCircle } from "react-icons/fa";

import { CheckIcon, XIcon } from "@quri/ui";

import { LoadMore } from "@/components/LoadMore";
import { Link } from "@/components/ui/Link";
import { usePaginator } from "@/hooks/usePaginator";
import { exportTypeIcon } from "@/lib/typeIcon";
import { variableRevisionRoute } from "@/routes";
import { Paginated } from "@/server/types";
import { VariableRevisionDTO } from "@/server/variables/data/variableRevisions";

const buildStatusIcon = (status: string) => {
  switch (status) {
    case "Success":
      return <CheckIcon className="text-emerald-700 opacity-30" />;
    case "Failure":
      return <XIcon className="text-red-500" />;
    case "Pending":
      return <FaClock className="text-yellow-500" />;
    case "Skipped":
      return <FaMinusCircle className="text-gray-500" />;
  }
};

export const VariableRevisionsPanel: FC<{
  page: Paginated<VariableRevisionDTO>;
  owner: string;
  modelSlug: string;
  variableName: string;
}> = ({ page: initialPage, owner, modelSlug, variableName }) => {
  const { items: revisions, loadNext } = usePaginator(initialPage);

  const pathname = usePathname();

  return (
    <div className="ml-4 flex flex-col rounded-sm bg-gray-50 px-3 py-2">
      <h3 className="mb-1 border-b pb-0.5 text-sm font-medium text-gray-700">
        Revisions
      </h3>
      <div className="w-full">
        {revisions.map((revision) => {
          const Icon = exportTypeIcon(revision.variableType);
          const link = variableRevisionRoute({
            owner,
            modelSlug,
            variableName,
            revisionId: revision.id,
          });

          return (
            <div
              key={revision.id}
              className={clsx(
                "flex items-center justify-between pb-0.5 pt-0.5 text-sm"
              )}
            >
              <div
                className={clsx(
                  "w-8/10 cursor-pointer pr-2 hover:text-gray-800 hover:underline",
                  pathname === link ? "text-blue-900" : "text-gray-400"
                )}
              >
                <Link href={link} className="block">
                  {format(revision.modelRevision.createdAt, "MMM dd h:mm a")}
                </Link>
              </div>
              <div className="w-1/10 flex items-center justify-end pr-1 text-gray-400">
                <Icon size={10} />
              </div>
              <div className="w-1/10 flex items-center justify-end">
                {buildStatusIcon(revision.modelRevision.buildStatus)}
              </div>
            </div>
          );
        })}
      </div>
      {loadNext && <LoadMore loadNext={loadNext} size="small" />}
    </div>
  );
};

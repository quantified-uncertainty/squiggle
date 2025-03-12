import React from "react";

import { StyledLink } from "@/components/ui/StyledLink";
import { SpecListActionsButton } from "@/evals/components/SpecListActionsButton";
import { getAllSpecLists } from "@/evals/data/specLists";
import { speclistRoute } from "@/lib/routes";

export const metadata = {
  title: "Spec Lists - Squiggle Hub",
};

export default async function SpecListsPage() {
  const specLists = await getAllSpecLists();

  return (
    <div>
      <div className="rounded-lg bg-white shadow-md">
        {specLists.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No spec lists found. Create one by running the add-speclist.ts
            script.
          </div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Specs Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {specLists.map((specList) => (
                <tr key={specList.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    <StyledLink href={speclistRoute({ id: specList.id })}>
                      {specList.name}
                    </StyledLink>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {specList.id}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {specList.specs.length}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    <SpecListActionsButton
                      specListId={specList.id}
                      specListName={specList.name}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

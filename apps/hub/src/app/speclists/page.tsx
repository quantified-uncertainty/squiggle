import React from "react";

import { getAllSpecLists } from "@quri/manifold-evals";

import { Link } from "@/components/ui/Link";

export const metadata = {
  title: "Spec Lists - Squiggle Hub",
};

export default async function SpecListsPage() {
  const specLists = await getAllSpecLists();

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Available Spec Lists</h2>
        <Link
          href="/speclists/evals"
          className="text-blue-600 hover:text-blue-800"
        >
          View Evaluations →
        </Link>
      </div>

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
                    {specList.id}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {specList.specs.length}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    <Link
                      href={`/speclists/${specList.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View
                    </Link>
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

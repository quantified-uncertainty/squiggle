import { notFound } from "next/navigation";

import { getSpecListById } from "@quri/evals";

import { Link } from "@/components/ui/Link";

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    const specList = await getSpecListById((await params).id);
    return {
      title: `${specList.name} - Squiggle Hub`,
    };
  } catch (error) {
    return {
      title: `Spec List: ${(await params).id} - Squiggle Hub`,
    };
  }
}

export default async function SpecListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    const specList = await getSpecListById((await params).id);

    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{specList.name}</h2>
            <p className="text-sm text-gray-500">ID: {specList.id}</p>
          </div>
          <Link
            href="/speclists"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            ← Back to Spec Lists
          </Link>
        </div>

        <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
          <h3 className="mb-4 text-lg font-medium">
            Specs ({specList.specs.length})
          </h3>

          {specList.specs.length === 0 ? (
            <p className="text-gray-500">This spec list has no specs.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {specList.specs.map((specItem) => (
                <li key={specItem.spec.id} className="py-4">
                  <div className="flex flex-col space-y-1">
                    <div className="text-sm font-medium text-gray-900">
                      {specItem.spec.description}
                    </div>
                    <div className="text-xs text-gray-500">
                      ID: {specItem.spec.id}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  } catch (error) {
    notFound();
  }
}

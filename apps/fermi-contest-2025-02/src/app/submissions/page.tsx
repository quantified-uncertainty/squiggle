import Link from "next/link";

import { getSubmissions } from "../lib/data";

export default async function SubmissionsPage() {
  const submissions = await getSubmissions();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Submissions</h1>

      {submissions.length === 0 ? (
        <div className="rounded-lg bg-yellow-50 p-6 text-center">
          <p className="text-lg">No submissions found.</p>
          <p className="mt-2">Run the collection script to add submissions.</p>
          <pre className="mt-4 inline-block rounded bg-gray-100 p-2">
            pnpm collect
          </pre>
        </div>
      ) : (
        <div className="space-y-6">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              className="overflow-hidden rounded-lg border shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="border-b bg-gray-50 px-6 py-4">
                <h2 className="text-xl font-semibold">
                  <Link
                    href={`/submissions/${submission.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {submission.author}
                  </Link>
                </h2>
              </div>
              <div className="px-6 py-4">
                <div className="mt-4 flex justify-end">
                  <Link
                    href={`/submissions/${submission.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    View Full Model →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import Link from 'next/link';
import { getSubmissions } from '../lib/data';

export default async function SubmissionsPage() {
  const submissions = await getSubmissions();
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Submissions</h1>
      
      {submissions.length === 0 ? (
        <div className="bg-yellow-50 p-6 rounded-lg text-center">
          <p className="text-lg">No submissions found.</p>
          <p className="mt-2">Run the collection script to add submissions.</p>
          <pre className="bg-gray-100 p-2 rounded mt-4 inline-block">pnpm collect</pre>
        </div>
      ) : (
        <div className="space-y-6">
          {submissions.map((submission) => (
            <div key={submission.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-gray-50 px-6 py-4 border-b">
                <h2 className="text-xl font-semibold">
                  <Link href={`/submissions/${submission.id}`} className="text-blue-600 hover:underline">
                    {submission.author}
                  </Link>
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  {submission.timestamp ? new Date(submission.timestamp).toLocaleString() : 'No timestamp'}
                </p>
              </div>
              <div className="px-6 py-4">
                <p className="font-medium text-gray-700 mb-2">Summary</p>
                <p>{submission.summary}</p>
                
                <p className="font-medium text-gray-700 mt-4 mb-2">Technique</p>
                <p>{submission.technique}</p>
                
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
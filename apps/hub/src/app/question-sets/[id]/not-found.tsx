import { Link } from "@/components/ui/Link";
import { questionSetsRoute } from "@/lib/routes";

export default function QuestionSetNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <h2 className="mb-4 text-2xl font-bold">Question Set Not Found</h2>
      <p className="mb-6 text-gray-600">
        {`The question set you're looking for doesn't exist or has been removed.`}
      </p>
      <Link
        href={questionSetsRoute()}
        className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
      >
        Back to Question Sets
      </Link>
    </div>
  );
}

import { H2 } from "@/components/ui/Headers";
import { getCodeErrors } from "@/server/ai/analytics";

export default async function () {
  const errors = await getCodeErrors();

  return (
    <div>
      <H2>Code errors</H2>
      <div className="space-y-4">
        {errors.map((error, i) => (
          <div key={i}>
            <div className="text-sm">
              <strong>{error.stepName}</strong>{" "}
              <span className="text-gray-500">
                ({error.date.toISOString()})
              </span>
            </div>
            <pre key={i} className="whitespace-pre-wrap text-xs">
              {error.error}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}

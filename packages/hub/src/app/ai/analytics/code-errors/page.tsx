import { getCodeErrors } from "@/ai/data/analytics";

import { StepErrorList } from "../StepErrorList";

const commonErrorTypes = {
  "sTest is not defined": "sTest import",
  'The "to" function only accepts paramaters above 0':
    "`A to B` with nonpositive args",
};

const SYNTAX_ERROR = "Syntax errors";
const SIGNATURE_ERROR = "Signature errors (total)";
const LONG_ERROR = "Long errors";
const NOT_DEFINED_ERROR = "Undefined variable";

export default async function () {
  const errors = await getCodeErrors();

  // pre-initialized to follow the right key order
  const stats: Record<string, number> = Object.fromEntries(
    Object.entries(commonErrorTypes).map(([, name]) => [name, 0])
  );

  const inc = (key: string) => (stats[key] = (stats[key] ?? 0) + 1);

  stats[SYNTAX_ERROR] = 0;
  stats[LONG_ERROR] = 0;
  stats[NOT_DEFINED_ERROR] = 0;
  stats[SIGNATURE_ERROR] = 0;

  for (const error of errors) {
    for (const [template, errorName] of Object.entries(commonErrorTypes)) {
      if (error.error.includes(template)) {
        inc(errorName);
      }
    }

    {
      const match = error.error.match(
        /^Error: There are function matches for (\w+)\(/
      );
      if (match) {
        inc(SIGNATURE_ERROR);
        inc(`${match[1]} signature`);
      }
    }

    if (error.error.length > 3000) {
      inc(LONG_ERROR);
    }

    if (error.error.startsWith('Expected "')) {
      inc(SYNTAX_ERROR);
    }

    if (
      error.error.match(/^\S+ is not defined/) &&
      !error.error.startsWith("sTest ")
    ) {
      inc(NOT_DEFINED_ERROR);
    }
  }

  return <StepErrorList errors={errors} title="Code errors" stats={stats} />;
}

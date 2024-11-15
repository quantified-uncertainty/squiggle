import { getStepErrors } from "@/server/ai/analytics";

import { StepErrorList } from "../StepErrorList";

export default async function () {
  const errors = await getStepErrors();

  const stats: Record<string, number> = {};
  stats["rate_limit"] = errors.filter((e) =>
    e.error.includes("rate limit")
  ).length;
  stats["price_limit"] = errors.filter((e) =>
    e.error.includes("Price limit")
  ).length;
  stats["search_and_replace"] = errors.filter((e) =>
    e.error.includes("Search and Replace Failed")
  ).length;

  return <StepErrorList errors={errors} title="Step errors" stats={stats} />;
}

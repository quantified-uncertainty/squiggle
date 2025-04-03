"use client";

import { useEffect, useRef, useState } from "react";

import { Link } from "@/components/ui/Link";
import { EvaluationDetails } from "@/evals/components/EvaluationDetails";
import { EvalWithDetailsDTO } from "@/evals/data/detailsEvals";
import { epistemicAgentRoute, questionSetRoute } from "@/lib/routes";

type Props = {
  evaluations: EvalWithDetailsDTO[];
};

export function StickyComparisonHeader({ evaluations }: Props) {
  const [isSticky, setIsSticky] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        const headerBottom = headerRef.current.getBoundingClientRect().bottom;
        setIsSticky(headerBottom < 0);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <div ref={headerRef}>
        <div className="flex gap-4">
          {evaluations.map((evaluation) => (
            <div key={evaluation.id} className="flex-1">
              <EvaluationDetails evaluation={evaluation} linkToEvaluation />
            </div>
          ))}
        </div>
      </div>

      {/* Sticky condensed header that appears when scrolled */}
      {isSticky && (
        <div className="fixed left-0 right-0 top-0 z-10 border-b border-gray-200 bg-white shadow-md">
          <div className="mx-auto max-w-7xl px-4 py-3">
            <div className="flex gap-4">
              {evaluations.map((evaluation) => (
                <div key={evaluation.id} className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      className="font-medium text-blue-600"
                      href={epistemicAgentRoute({
                        id: evaluation.agent.id,
                      })}
                    >
                      {evaluation.agent.name}
                    </Link>
                    <span className="text-sm text-gray-500">on</span>
                    <Link
                      className="text-sm font-medium"
                      href={questionSetRoute({
                        id: evaluation.questionSet.id,
                      })}
                    >
                      {evaluation.questionSet.name}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

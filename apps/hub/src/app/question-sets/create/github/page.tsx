"use client";

import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/Card";

export default function CreateQuestionSetFromGitHubIssuesPage() {
  const router = useRouter();

  return (
    <Card theme="big">
      <p className="mb-4">
        This page will prompt the user to enter a GitHub repository URL, and
        then select one or more issues from the repository to create a new
        question set.
      </p>
      <p className="mb-4">
        It will also contain a textarea that would convert the issues into
        questions, e.g. &quot;Estimate the expected value for this issue&quot;.
      </p>
    </Card>
  );
}

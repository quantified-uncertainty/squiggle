import { useCallback, useMemo, useState } from "react";

import { CreateRequestBody, SquiggleResponse } from "../utils/squiggleTypes";

type JobStatus = "pending" | "completed" | "error";

type Job = {
  id: string;
  status: JobStatus;
  response?: SquiggleResponse;
  errorMessage?: string;
};

type BatchRequest = {
  id: string;
  timestamp: Date;
  numRequests: number;
  isCancelled: boolean;
  requestBody: CreateRequestBody;
  jobs: Job[];
  isCompleted: boolean;
};

export function useBatchRequests() {
  const [batches, setBatches] = useState<Record<string, BatchRequest>>({});

  const createBatchRequest = useCallback(
    async (numRequests: number, requestBody: CreateRequestBody) => {
      const batchId = `batch-${Date.now()}`;
      const newBatch: BatchRequest = {
        id: batchId,
        timestamp: new Date(),
        numRequests,
        isCancelled: false,
        requestBody,
        jobs: Array.from({ length: numRequests }, (_, i) => ({
          id: `job-${Date.now()}-${i}`,
          status: "pending",
        })),
        isCompleted: false,
      };

      setBatches((prev) => ({ ...prev, [batchId]: newBatch }));

      const updateJob = (jobId: string, updates: Partial<Job>) => {
        setBatches((prev) => {
          const updatedBatch = { ...prev[batchId] };
          updatedBatch.jobs = updatedBatch.jobs.map((job) =>
            job.id === jobId ? { ...job, ...updates } : job
          );
          updatedBatch.isCompleted = updatedBatch.jobs.every(
            (job) => job.status === "completed" || job.status === "error"
          );
          return { ...prev, [batchId]: updatedBatch };
        });
      };

      const jobPromises = newBatch.jobs.map((job) =>
        fetch("/api/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        })
          .then(async (response) => {
            if (!response.ok) throw new Error("API request failed");
            const result: SquiggleResponse = await response.json();
            updateJob(job.id, { status: "completed", response: result });
            return result;
          })
          .catch((error) => {
            updateJob(job.id, {
              status: "error",
              errorMessage:
                error instanceof Error
                  ? error.message
                  : "Unknown error occurred",
            });
            throw error;
          })
      );

      try {
        await Promise.all(jobPromises);
      } catch (error) {
        console.error("One or more jobs failed:", error);
      }

      return batchId;
    },
    []
  );

  const cancelBatchRequest = useCallback((batchId: string) => {
    setBatches((prev) => ({
      ...prev,
      [batchId]: { ...prev[batchId], isCancelled: true },
    }));
    // Note: This doesn't actually cancel the API requests.
    // You might need to implement cancellation on the server-side if needed.
  }, []);

  const allBatchRequests = useMemo(() => Object.values(batches), [batches]);
  const latestBatchRequest = useMemo(
    () => allBatchRequests[allBatchRequests.length - 1],
    [allBatchRequests]
  );

  return {
    createBatchRequest,
    cancelBatchRequest,
    allBatchRequests,
    latestBatchRequest,
  };
}

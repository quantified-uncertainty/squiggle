import Skeleton from "react-loading-skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton height={32} width={500} />
      <Skeleton height={256} />
    </div>
  );
}

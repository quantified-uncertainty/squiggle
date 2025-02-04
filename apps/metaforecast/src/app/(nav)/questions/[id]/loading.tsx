import Skeleton from "react-loading-skeleton";

export default function QuestionLoading() {
  return (
    <div>
      <h1 className="text-lg sm:text-3xl">
        <Skeleton />
      </h1>
      <Skeleton height={400} />
      <div className="my-4">
        <Skeleton count={5} />
      </div>
    </div>
  );
}

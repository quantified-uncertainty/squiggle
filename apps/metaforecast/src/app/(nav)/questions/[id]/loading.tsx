import Skeleton from 'react-loading-skeleton';

export default function () {
  return (
    <div>
      <h1 className="sm:text-3xl text-lg">
        <Skeleton />
      </h1>
      <Skeleton height={400} />
      <div className="my-4">
        <Skeleton count={5} />
      </div>
    </div>
  );
}

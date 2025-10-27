interface CardSkeletonProps {
  count?: number;
}

export const CardSkeleton = ({ count = 1 }: CardSkeletonProps) => {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded w-20"></div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      ))}
    </>
  );
};

export default CardSkeleton;

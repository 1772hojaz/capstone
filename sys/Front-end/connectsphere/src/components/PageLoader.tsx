import LoadingSpinner from './LoadingSpinner';

interface PageLoaderProps {
  message?: string;
}

export const PageLoader = ({ message = 'Loading...' }: PageLoaderProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600 text-lg">{message}</p>
      </div>
    </div>
  );
};

export default PageLoader;

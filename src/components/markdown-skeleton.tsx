export function MarkdownSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 md:p-8 animate-pulse">
      <div className="space-y-4">
        {/* Title skeleton */}
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        
        {/* Paragraph skeletons */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        </div>
        
        {/* Subtitle skeleton */}
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mt-6"></div>
        
        {/* More paragraph skeletons */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
        
        {/* Code block skeleton */}
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded mt-4"></div>
        
        {/* More content */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        </div>
      </div>
    </div>
  );
}
export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col pt-16 animate-pulse">
      <div className="pt-12 pb-8 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="h-9 w-64 bg-gray-200 dark:bg-gray-800 rounded-lg mb-3" />
          <div className="h-4 w-48 bg-gray-100 dark:bg-gray-800/70 rounded-md" />
        </div>
      </div>
      <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="h-6 w-40 bg-gray-200 dark:bg-gray-800 rounded-md" />
          <div className="p-6 sm:p-10 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl">
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
              {Array.from({ length: 32 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-lg bg-gray-100 dark:bg-gray-800" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

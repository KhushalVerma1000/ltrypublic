export default function Loading() {
  return (
    <div className="min-h-screen bg-[#f8fafc] animate-pulse">
      <div className="h-16" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="h-8 w-56 bg-gray-200 rounded-lg mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 md:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white border border-gray-100 p-5 space-y-3">
              <div className="h-4 w-2/3 bg-gray-200 rounded-md" />
              <div className="h-3 w-1/2 bg-gray-100 rounded-md" />
              <div className="h-20 w-full bg-gray-100 rounded-xl" />
              <div className="h-8 w-full bg-gray-200 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

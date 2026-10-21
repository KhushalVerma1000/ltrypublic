export default function Loading() {
  return (
    <div className="min-h-screen bg-paper animate-pulse">
      <div className="h-[100px]" />
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-10">
        <div className="h-9 w-64 bg-brand-100 rounded-lg mx-auto mb-8" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-[1.25rem] bg-white border border-brand-100 overflow-hidden">
              <div className="aspect-[5/4] sm:aspect-[16/10] bg-brand-100" />
              <div className="p-3 sm:p-4 space-y-3">
                <div className="h-4 w-2/3 bg-brand-100 rounded-md" />
                <div className="h-7 w-1/3 bg-brand-100 rounded-md" />
                <div className="h-2 w-full bg-brand-50 rounded-full" />
                <div className="h-10 w-full bg-brand-100 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

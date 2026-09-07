export function RouteSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-pulse">
      <div className="h-24 rounded-2xl bg-[#E9EDEC]" />
      <div className="flex gap-3">
        <div className="h-8 w-32 rounded-full bg-[#E9EDEC]" />
        <div className="h-8 w-24 rounded-full bg-[#E9EDEC]" />
      </div>
      <div className="space-y-3">
        <div className="h-16 rounded-xl bg-[#E9EDEC]" />
        <div className="h-16 rounded-xl bg-[#E9EDEC]" />
        <div className="h-16 rounded-xl bg-[#E9EDEC]" />
      </div>
    </div>
  );
}

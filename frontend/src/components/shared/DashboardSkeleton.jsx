export default function DashboardSkeleton() {
  return (
    <div className="max-w-container-max mx-auto space-y-6 animate-pulse">
      {/* Hero banner skeleton */}
      <div className="h-44 rounded-2xl bg-surface-container-high" />

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-surface-container-high" />
        ))}
      </div>

      {/* Two column content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="h-5 w-40 rounded-full bg-surface-container-high" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-surface-container-high" />
          ))}
        </div>
        <div className="space-y-3">
          <div className="h-5 w-32 rounded-full bg-surface-container-high" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-surface-container-high" />
          ))}
        </div>
      </div>
    </div>
  );
}

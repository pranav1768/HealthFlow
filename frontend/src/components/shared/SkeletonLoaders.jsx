// ─── Reusable skeleton primitives ─────────────────────────────────────────────
function Bone({ className = '' }) {
  return <div className={`animate-pulse bg-surface-container-high rounded-lg ${className}`} />;
}

// ─── List skeleton (appointments, records, payments) ──────────────────────────
export function ListSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="bg-surface-white border border-border-light rounded-xl p-5 flex items-center gap-4">
          <Bone className="w-12 h-12 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Bone className="h-4 w-48" />
            <Bone className="h-3 w-32" />
            <Bone className="h-3 w-24" />
          </div>
          <Bone className="h-7 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ─── Card grid skeleton (doctor search, patients) ─────────────────────────────
export function CardGridSkeleton({ cols = 3, rows = 2 }) {
  const colClass = cols === 2 ? 'md:grid-cols-2' : cols === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3';
  return (
    <div className={`grid grid-cols-1 ${colClass} gap-4`}>
      {[...Array(cols * rows)].map((_, i) => (
        <div key={i} className="bg-surface-white border border-border-light rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <Bone className="w-14 h-14 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Bone className="h-4 w-32" />
              <Bone className="h-3 w-24" />
            </div>
          </div>
          <Bone className="h-3 w-full" />
          <Bone className="h-3 w-3/4" />
          <div className="flex gap-2 pt-1">
            <Bone className="h-6 w-16 rounded-full" />
            <Bone className="h-6 w-16 rounded-full" />
          </div>
          <Bone className="h-9 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ─── Table skeleton (admin users) ─────────────────────────────────────────────
export function TableSkeleton({ rows = 6 }) {
  return (
    <div className="bg-surface-white border border-border-light rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-border-light bg-surface-container-lowest">
        {[120, 80, 60, 80, 100].map((w, i) => (
          <Bone key={i} className={`h-3`} style={{ width: w }} />
        ))}
      </div>
      {/* Rows */}
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-border-light last:border-0">
          <div className="flex items-center gap-3 w-40">
            <Bone className="w-8 h-8 rounded-full flex-shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Bone className="h-3 w-24" />
              <Bone className="h-2.5 w-32" />
            </div>
          </div>
          <Bone className="h-3 w-16" />
          <Bone className="h-5 w-14 rounded-full" />
          <Bone className="h-3 w-20" />
          <Bone className="h-7 w-16 rounded-full ml-auto" />
        </div>
      ))}
    </div>
  );
}

// ─── Analytics skeleton ────────────────────────────────────────────────────────
export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Bone key={i} className="h-28 rounded-xl" />)}
      </div>
      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Bone className="h-72 rounded-xl" />
        <Bone className="h-72 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Bone className="h-64 rounded-xl" />
        <Bone className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Records/payments timeline skeleton ───────────────────────────────────────
export function TimelineSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="bg-surface-white border border-border-light rounded-xl p-5 flex gap-4">
          <Bone className="w-12 h-12 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Bone className="h-4 w-40" />
            <Bone className="h-3 w-24" />
            <Bone className="h-3 w-64" />
            <div className="flex gap-2 pt-1">
              <Bone className="h-6 w-20 rounded-full" />
            </div>
          </div>
          <Bone className="w-8 h-8 rounded-lg flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

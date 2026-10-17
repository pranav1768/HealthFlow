/**
 * KPICard — exact structure from the "platform_analytics_dashboard_refined"
 * Stitch export. trend > 0 renders an up arrow in secondary/teal; trend < 0
 * renders a down arrow in error red. iconBg/iconColor let each KPI reuse one
 * of the four icon-chip color pairs seen in the export (primary-fixed,
 * secondary-fixed, error-container, tertiary-fixed).
 */
export default function KPICard({ icon, iconBg = 'bg-primary-fixed', iconColor = 'text-primary', label, value, suffix, trend }) {
  const isPositive = trend !== undefined && trend >= 0;
  const trendClasses =
    trend === undefined
      ? null
      : isPositive
        ? 'text-secondary bg-secondary-fixed-dim bg-opacity-20'
        : 'text-error bg-error-container bg-opacity-50';

  return (
    <div className="glass-card p-stack-md flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 ${iconBg} rounded-lg ${iconColor} flex items-center justify-center`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        {trend !== undefined && (
          <span className={`inline-flex items-center gap-1 font-label-sm text-label-sm px-2 py-1 rounded-full ${trendClasses}`}>
            <span className="material-symbols-outlined text-[14px]">
              {isPositive ? 'trending_up' : 'trending_down'}
            </span>
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <h3 className="font-label-md text-label-md text-text-muted mb-1">{label}</h3>
        <div className="font-display-lg text-display-lg text-on-surface flex items-baseline gap-1">
          {value}
          {suffix && <span className="font-title-lg text-title-lg text-text-muted">{suffix}</span>}
        </div>
      </div>
    </div>
  );
}

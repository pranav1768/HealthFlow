/**
 * FilterPills — toggleable pill row. Selected state matches the exact
 * "active filter" chip from the doctor_search export (secondary/10 bg,
 * secondary text, removable with a close icon). Unselected pills use a
 * neutral outline so the row reads as a single coherent filter bar.
 *
 * options: [{ value, label }]
 * value: array of selected values (multi) or a single value (single-select)
 */
export default function FilterPills({ options, value, onChange, multi = false }) {
  const selected = Array.isArray(value) ? value : [value].filter(Boolean);

  function toggle(optionValue) {
    if (!multi) {
      onChange(value === optionValue ? null : optionValue);
      return;
    }
    if (selected.includes(optionValue)) {
      onChange(selected.filter((v) => v !== optionValue));
    } else {
      onChange([...selected, optionValue]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isActive = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={`font-label-sm text-label-sm px-3 py-1 rounded-full flex items-center gap-1 cursor-pointer transition-colors ${
              isActive
                ? 'bg-secondary/10 text-secondary hover:bg-secondary/20'
                : 'bg-surface-container-low text-on-surface-variant border border-border-light hover:bg-surface-container-high'
            }`}
          >
            {opt.label}
            {isActive && <span className="material-symbols-outlined text-[14px]">close</span>}
          </button>
        );
      })}
    </div>
  );
}

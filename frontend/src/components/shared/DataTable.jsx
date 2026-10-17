/**
 * Generic data table matching the exact Stitch "user_management" markup
 * structure: card wrapper with hover shadow, low-contrast header row,
 * divided rows with hover highlight.
 *
 * columns: [{ key, header, align?: 'left'|'right', render?: (row) => node }]
 * rows: array of data objects (must each have a stable `id` or `_id`)
 */
export default function DataTable({ columns, rows, emptyMessage = 'No records found.' }) {
  return (
    <div className="bg-surface-white rounded-lg border border-light overflow-hidden card-hover transition-shadow">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-light">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-4 font-label-sm text-label-sm text-text-muted uppercase tracking-wider ${
                    col.align === 'right' ? 'text-right' : ''
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-light">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-10 text-center text-body-md font-body-md text-text-muted">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id || row._id} className="hover:bg-surface-bright transition-colors group">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-6 py-4 ${col.align === 'right' ? 'text-right' : ''}`}
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

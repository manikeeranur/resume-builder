// Exact port of platform-fe's components/common/table-skeleton.tsx —
// TypeScript types stripped, otherwise unchanged. border-border-secondary
// resolves via the token alias added to tailwind.config.js; the gray-*
// classes are Tailwind's standard palette, no alias needed.
import { cn } from "@/components/lib/utils";

const widths = ["w-32", "w-24", "w-28", "w-20", "w-36"];

export default function TableSkeleton({ columns, rows = 6, hasActionColumn = true }) {
  const columnCount = Math.max(1, columns);
  const rowCount = Math.max(1, rows);

  return (
    <>
      {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b border-border-secondary last:border-b-0" aria-hidden="true">
          {Array.from({ length: columnCount }).map((__, columnIndex) => {
            const isFirstColumn = columnIndex === 0;
            const isActionColumn = hasActionColumn && columnIndex === columnCount - 1;

            return (
              <td key={columnIndex} className="px-4 py-3">
                {isFirstColumn ? (
                  <div className="flex items-center gap-3">
                    <span className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-gray-200" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <span className="block h-3 w-36 animate-pulse rounded-full bg-gray-200" />
                      <span className="block h-3 w-48 max-w-full animate-pulse rounded-full bg-gray-100" />
                    </div>
                  </div>
                ) : isActionColumn ? (
                  <span className="ml-auto block h-8 w-8 animate-pulse rounded-md bg-gray-100" />
                ) : (
                  <span className={cn("block h-3 animate-pulse rounded-full bg-gray-200", widths[columnIndex % widths.length])} />
                )}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}

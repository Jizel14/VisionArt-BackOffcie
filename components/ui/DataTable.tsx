"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import Button from "./Button";

/* ------------------------------------------------------------------ */

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  sortKey?: string;
  sortDir?: "asc" | "desc";
  onSort?: (key: string) => void;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export default function DataTable<T>({
  columns,
  data,
  keyField,
  page = 1,
  totalPages = 1,
  onPageChange,
  sortKey,
  sortDir,
  onSort,
  onRowClick,
  loading,
  emptyMessage = "Aucune donnée",
}: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400",
                    col.sortable && "cursor-pointer select-none hover:text-slate-900 dark:hover:text-slate-200",
                    col.className
                  )}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      <ArrowUpDown
                        className={cn(
                          "h-3.5 w-3.5 transition-colors",
                          sortKey === col.key
                            ? "text-blue-600"
                            : "text-slate-300 dark:text-slate-600"
                        )}
                      />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-12 text-center text-slate-400"
                >
                  Chargement...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-12 text-center text-slate-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={String(row[keyField])}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "border-b border-slate-100 transition-colors dark:border-slate-800/50",
                    onRowClick &&
                      "cursor-pointer hover:bg-blue-50/50 dark:hover:bg-slate-800/50"
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-4 py-3 text-slate-700 dark:text-slate-300",
                        col.className
                      )}
                    >
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-sm text-slate-500">
            Page {page} / {totalPages}
          </span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange?.(page - 1)}
              icon={<ChevronLeft className="h-4 w-4" />}
            >
              Précédent
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange?.(page + 1)}
              icon={<ChevronRight className="h-4 w-4" />}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

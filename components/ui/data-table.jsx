'use client';

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export function DataTable({
  columns,
  data,
  pagination,
  onPaginationChange,
  pageCount,
  pageInfo,
  loading,
  emptyMessage = 'No results found',
  onRowClick,
}) {
  const table = useReactTable({
    data,
    columns,
    manualPagination: true,
    pageCount,
    state: {
      pagination,
    },
    getCoreRowModel: getCoreRowModel(),
    onPaginationChange,
  });

  return (
    <div className="space-y-4">
      <div className="relative rounded-xl border border-slate-200 bg-white shadow-sm">
        <Table className="min-w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-slate-50/60">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      'px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600',
                      header.column.columnDef.meta?.className,
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className={cn(
                    'cursor-pointer border-b border-slate-100/80 transition-colors hover:bg-slate-50/80',
                    onRowClick ? 'hover:text-slate-900' : 'cursor-default',
                  )}
                  onClick={() => {
                    if (onRowClick) onRowClick(row.original);
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-6 py-4 align-middle text-sm text-slate-700">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-sm text-slate-500">
                  {loading ? 'Loading assignments…' : emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/70">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
          </div>
        )}
      </div>

      <DataTablePagination table={table} pageCount={pageCount} pageInfo={pageInfo} />
    </div>
  );
}

function DataTablePagination({ table, pageCount, pageInfo }) {
  const paginationState = table.getState().pagination;
  const currentPage = pageInfo?.page ?? paginationState.pageIndex + 1;
  const pageSize = pageInfo?.limit ?? paginationState.pageSize;
  const totalItems = pageInfo?.totalDocs ?? 0;
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = totalItems === 0 ? 0 : Math.min(totalItems, start + (pageInfo?.docsCount ?? table.getRowModel().rows.length) - 1);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-slate-600">
        {totalItems > 0 ? (
          <span>
            Showing <span className="font-medium text-slate-900">{start}</span> -{' '}
            <span className="font-medium text-slate-900">{end}</span> of{' '}
            <span className="font-medium text-slate-900">{totalItems}</span>
          </span>
        ) : (
          <span>No assignments available</span>
        )}
      </div>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
        <div className="flex items-center space-x-2 text-sm text-slate-600">
          <span className="hidden sm:inline">Rows per page</span>
          <Select
            value={String(paginationState.pageSize)}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
              table.setPageIndex(0);
            }}
          >
            <SelectTrigger className="h-9 w-20">
              <SelectValue placeholder={paginationState.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 50].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => table.setPageIndex(0)}
            disabled={paginationState.pageIndex === 0}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => table.previousPage()}
            disabled={paginationState.pageIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-slate-700">
            Page {currentPage} of {pageCount || 1}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => table.nextPage()}
            disabled={pageCount ? paginationState.pageIndex >= pageCount - 1 : false}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => table.setPageIndex(pageCount ? pageCount - 1 : paginationState.pageIndex)}
            disabled={pageCount ? paginationState.pageIndex >= pageCount - 1 : false}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  PaginationState,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DataTableToolbar } from "./data-table-toolbar"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageCount: number
  pagination: PaginationState
  setPagination: (pagination: PaginationState) => void
  onFilterChange: (key: string, value: string) => void
  onViewAction?: (row: TData) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount,
  pagination,
  setPagination,
  onFilterChange,
  onViewAction
}: DataTableProps<TData, TValue>) {
  
  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: { pagination },
    onPaginationChange: (updater) => {
        if (typeof updater === 'function') {
            const newPagination = updater(pagination);
            setPagination(newPagination);
        }
    },
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    // Pasamos la función de acción a través de meta para que las columnas la vean
    meta: {
        onViewAction
    }
  })

  return (
    <div className="space-y-4">
      <DataTableToolbar table={table} onFilterChange={onFilterChange} />
      <div className="rounded-md border border-ciay-gold/20 bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-ciay-cream/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-ciay-gold/10 hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-ciay-brown font-bold uppercase text-xs tracking-wider">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="border-ciay-gold/10 hover:bg-ciay-cream/20">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-ciay-slate">
                  No se encontraron resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-between space-x-2 py-4 px-2">
        <div className="text-sm text-muted-foreground">
          Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
        </div>
        <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Siguiente
            </Button>
        </div>
      </div>
    </div>
  )
}
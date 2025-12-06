'use client'

import React, { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnFiltersState
} from '@tanstack/react-table'

interface LogEntry {
  id: string
  severity: string
  message: string
  category?: string
  metadata?: Record<string, unknown>
  timestamp: Date
}

interface LogsTableProps {
  entityId: string
  logs: LogEntry[]
}

const columnHelper = createColumnHelper<LogEntry>()

export function LogsTable({ entityId, logs }: LogsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'timestamp', desc: true }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [severityFilter, setSeverityFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [searchText, setSearchText] = useState<string>('')

  const filteredLogs = useMemo(() => {
    let filtered = logs

    if (severityFilter) {
      filtered = filtered.filter(log => log.severity === severityFilter)
    }

    if (categoryFilter) {
      filtered = filtered.filter(log => log.category === categoryFilter)
    }

    if (searchText) {
      const lowerText = searchText.toLowerCase()
      filtered = filtered.filter(
        log =>
          log.message.toLowerCase().includes(lowerText) ||
          log.id.toLowerCase().includes(lowerText)
      )
    }

    return filtered
  }, [logs, severityFilter, categoryFilter, searchText])

  const columns = [
    columnHelper.accessor('timestamp', {
      header: 'Timestamp',
      cell: info => new Date(info.getValue()).toLocaleString(),
      size: 180
    }),
    columnHelper.accessor('severity', {
      header: 'Severity',
      cell: info => {
        const severity = info.getValue()
        const colors: Record<string, string> = {
          critical: 'bg-red-100 text-red-800',
          error: 'bg-red-100 text-red-800',
          warning: 'bg-yellow-100 text-yellow-800',
          info: 'bg-blue-100 text-blue-800'
        }
        return (
          <span className={`px-2 py-1 rounded text-xs font-semibold ${colors[severity] || 'bg-gray-100'}`}>
            {severity}
          </span>
        )
      },
      size: 100
    }),
    columnHelper.accessor('category', {
      header: 'Category',
      cell: info => (
        <span className="text-gray-600 text-sm">
          {info.getValue() || '-'}
        </span>
      ),
      size: 100
    }),
    columnHelper.accessor('message', {
      header: 'Message',
      cell: info => (
        <div className="truncate max-w-lg" title={info.getValue()}>
          {info.getValue()}
        </div>
      ),
      size: 300
    })
  ]

  const table = useReactTable({
    data: filteredLogs,
    columns,
    state: {
      sorting,
      columnFilters
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  const severityOptions = Array.from(new Set(logs.map(l => l.severity)))
  const categoryOptions = Array.from(new Set(logs.map(l => l.category).filter(Boolean)))

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Logs</h3>

      {/* Filters */}
      <div className="flex gap-4 mb-4 flex-wrap">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Search</label>
          <input
            type="text"
            placeholder="Search messages..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Filter by Severity</label>
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Severity</option>
            {severityOptions.map(sev => (
              <option key={sev} value={sev}>
                {sev}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Filter by Category</label>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categoryOptions.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="text-sm text-gray-600 self-end pb-1">
          Showing {filteredLogs.length} of {logs.length} entries
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-300 bg-gray-50">
              {table.getHeaderGroups().map(headerGroup =>
                headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-4 py-2 text-left font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ width: header.getSize() }}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span className="text-xs">
                          {header.column.getIsSorted() === 'desc' ? ' 🔽' : header.column.getIsSorted() === 'asc' ? ' 🔼' : ' 🔄'}
                        </span>
                      )}
                    </div>
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="border-b border-gray-200 hover:bg-gray-50">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-4 py-3" style={{ width: cell.column.getSize() }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredLogs.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No logs found</p>
        </div>
      )}

      {/* Pagination */}
      {filteredLogs.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

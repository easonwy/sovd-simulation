'use client'

import React, { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnFiltersState
} from '@tanstack/react-table'

interface Fault {
  code: string
  title?: string
  description?: string
  severity: string
  status: string
  created: Date
  updated: Date
}

interface FaultsTableProps {
  entityId: string
  faults: Fault[]
  onConfirm?: (code: string) => Promise<void>
  onClear?: (code: string) => Promise<void>
}

const columnHelper = createColumnHelper<Fault>()

export function FaultsTable({ entityId, faults, onConfirm, onClear }: FaultsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'created', desc: true }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [severityFilter, setSeverityFilter] = useState<string>('')
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})

  const filteredFaults = useMemo(() => {
    let filtered = faults

    if (statusFilter) {
      filtered = filtered.filter(f => f.status === statusFilter)
    }

    if (severityFilter) {
      filtered = filtered.filter(f => f.severity === severityFilter)
    }

    return filtered
  }, [faults, statusFilter, severityFilter])

  const columns = [
    columnHelper.accessor('code', {
      header: 'Fault Code',
      cell: info => (
        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">{info.getValue()}</code>
      ),
      size: 120
    }),
    columnHelper.accessor('title', {
      header: 'Title',
      cell: info => (
        <div className="truncate max-w-xs" title={info.getValue()}>
          {info.getValue() || '-'}
        </div>
      ),
      size: 200
    }),
    columnHelper.accessor('severity', {
      header: 'Severity',
      cell: info => {
        const severity = info.getValue()
        const colors: Record<string, string> = {
          critical: 'bg-red-100 text-red-800',
          high: 'bg-orange-100 text-orange-800',
          medium: 'bg-yellow-100 text-yellow-800',
          low: 'bg-blue-100 text-blue-800'
        }
        return (
          <span className={`px-2 py-1 rounded text-xs font-semibold ${colors[severity] || 'bg-gray-100'}`}>
            {severity}
          </span>
        )
      },
      size: 100
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => {
        const status = info.getValue()
        const colors: Record<string, string> = {
          active: 'bg-red-100 text-red-800',
          confirmed: 'bg-yellow-100 text-yellow-800',
          resolved: 'bg-green-100 text-green-800'
        }
        return (
          <span className={`px-2 py-1 rounded text-xs font-semibold ${colors[status] || 'bg-gray-100'}`}>
            {status}
          </span>
        )
      },
      size: 100
    }),
    columnHelper.accessor('created', {
      header: 'Created',
      cell: info => new Date(info.getValue()).toLocaleString(),
      size: 180
    }),
    columnHelper.accessor('updated', {
      header: 'Updated',
      cell: info => new Date(info.getValue()).toLocaleString(),
      size: 180
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          {row.original.status !== 'confirmed' && (
            <button
              onClick={() => handleConfirm(row.original.code)}
              disabled={loadingStates[`confirm-${row.original.code}`]}
              className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loadingStates[`confirm-${row.original.code}`] ? 'Confirming...' : 'Confirm'}
            </button>
          )}
          {row.original.status !== 'resolved' && (
            <button
              onClick={() => handleClear(row.original.code)}
              disabled={loadingStates[`clear-${row.original.code}`]}
              className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loadingStates[`clear-${row.original.code}`] ? 'Clearing...' : 'Clear'}
            </button>
          )}
        </div>
      ),
      size: 150
    })
  ]

  const handleConfirm = async (code: string) => {
    if (!onConfirm) return

    try {
      setLoadingStates(prev => ({ ...prev, [`confirm-${code}`]: true }))
      await onConfirm(code)
      setLoadingStates(prev => ({ ...prev, [`confirm-${code}`]: false }))
    } catch (error) {
      console.error('Failed to confirm fault:', error)
      setLoadingStates(prev => ({ ...prev, [`confirm-${code}`]: false }))
    }
  }

  const handleClear = async (code: string) => {
    if (!onClear) return

    try {
      setLoadingStates(prev => ({ ...prev, [`clear-${code}`]: true }))
      await onClear(code)
      setLoadingStates(prev => ({ ...prev, [`clear-${code}`]: false }))
    } catch (error) {
      console.error('Failed to clear fault:', error)
      setLoadingStates(prev => ({ ...prev, [`clear-${code}`]: false }))
    }
  }

  const table = useReactTable({
    data: filteredFaults,
    columns,
    state: {
      sorting,
      columnFilters
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel()
  })

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Faults</h3>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="confirmed">Confirmed</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Filter by Severity</label>
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="text-sm text-gray-600 self-end pb-1">
          Showing {filteredFaults.length} of {faults.length} faults
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

      {filteredFaults.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No faults found</p>
        </div>
      )}
    </div>
  )
}

"use client"
import { useState, useMemo } from 'react'

interface TimelineEntry {
  timestamp: string | number | Date
  value?: any
  status?: string
  label?: string
  severity?: 'info' | 'warning' | 'error' | 'success'
}

interface DataTimelineProps {
  entries: TimelineEntry[]
  title?: string
  maxItems?: number
}

export function DataTimeline({ entries, title = 'Timeline', maxItems = 100 }: DataTimelineProps) {
  const [selectedEntry, setSelectedEntry] = useState<TimelineEntry | null>(null)

  const sortedEntries = useMemo(() => {
    return [...entries]
      .sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime()
        const timeB = new Date(b.timestamp).getTime()
        return timeB - timeA // Most recent first
      })
      .slice(0, maxItems)
  }, [entries, maxItems])

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'error':
        return 'bg-red-100 text-red-700 border-red-300'
      case 'warning':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'success':
        return 'bg-green-100 text-green-700 border-green-300'
      default:
        return 'bg-blue-100 text-blue-700 border-blue-300'
    }
  }

  const getSeverityDot = (severity?: string) => {
    switch (severity) {
      case 'error':
        return 'bg-red-500'
      case 'warning':
        return 'bg-yellow-500'
      case 'success':
        return 'bg-green-500'
      default:
        return 'bg-blue-500'
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>

      <div className="flex gap-6">
        {/* Timeline */}
        <div className="flex-1 space-y-0">
          {sortedEntries.map((entry, idx) => {
            const isSelected = selectedEntry === entry
            const timestamp = new Date(entry.timestamp)

            return (
              <div
                key={idx}
                onClick={() => setSelectedEntry(isSelected ? null : entry)}
                className={`relative flex gap-4 p-3 cursor-pointer transition-all ${
                  isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'
                }`}
              >
                {/* Timeline dot and line */}
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${getSeverityDot(entry.severity)} mt-1`} />
                  {idx < sortedEntries.length - 1 && <div className="w-0.5 h-8 bg-gray-300 mt-1" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {entry.label || `Entry ${idx + 1}`}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {timestamp.toLocaleString()}
                      </p>
                    </div>
                    {entry.status && (
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${getSeverityColor(
                          entry.severity
                        )}`}
                      >
                        {entry.status}
                      </span>
                    )}
                  </div>

                  {/* Value preview */}
                  {entry.value !== undefined && (
                    <div className="mt-1 text-sm text-gray-600 truncate font-mono">
                      {typeof entry.value === 'object'
                        ? JSON.stringify(entry.value).substring(0, 100)
                        : String(entry.value)}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Details panel */}
        {selectedEntry && (
          <div className="w-80 bg-white rounded-lg shadow-lg p-4 max-h-96 overflow-auto border-l-4 border-blue-500">
            <h4 className="font-semibold text-gray-900 mb-3">Details</h4>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600 font-medium">Timestamp</p>
                <p className="text-gray-900 font-mono">
                  {new Date(selectedEntry.timestamp).toLocaleString()}
                </p>
              </div>

              {selectedEntry.label && (
                <div>
                  <p className="text-gray-600 font-medium">Label</p>
                  <p className="text-gray-900">{selectedEntry.label}</p>
                </div>
              )}

              {selectedEntry.status && (
                <div>
                  <p className="text-gray-600 font-medium">Status</p>
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${getSeverityColor(
                      selectedEntry.severity
                    )}`}
                  >
                    {selectedEntry.status}
                  </span>
                </div>
              )}

              {selectedEntry.value !== undefined && (
                <div>
                  <p className="text-gray-600 font-medium">Value</p>
                  <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto max-h-40 whitespace-pre-wrap break-words">
                    {typeof selectedEntry.value === 'object'
                      ? JSON.stringify(selectedEntry.value, null, 2)
                      : String(selectedEntry.value)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {sortedEntries.length === 0 && <div className="text-gray-500 text-center py-8">No entries</div>}
    </div>
  )
}

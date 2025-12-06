'use client'

import React, { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface DataPoint {
  timestamp: string
  value: number
  min?: number
  max?: number
  count?: number
}

interface DataChartProps {
  entityId: string
  dataId: string
  title?: string
  chartType?: 'line' | 'area'
}

export function DataChart({
  entityId,
  dataId,
  title = 'Data History',
  chartType = 'line'
}: DataChartProps) {
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d' | '30d'>('24h')
  const [bucketSize, setBucketSize] = useState<'minute' | 'hour' | 'day'>('hour')
  const [data, setData] = useState<DataPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchHistory()
  }, [timeRange, bucketSize])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `/v1/${entityId.split('/')[0]}/${entityId.split('/')[1]}/data/${dataId}/history?timeRange=${timeRange}&bucketSize=${bucketSize}`
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch history: ${response.statusText}`)
      }

      const result = await response.json()
      const formattedData = result.items.map((item: any) => ({
        timestamp: new Date(item.timestamp).toLocaleString(),
        value: item.value,
        min: item.min,
        max: item.max,
        count: item.count
      }))

      setData(formattedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Failed to fetch data history:', err)
    } finally {
      setLoading(false)
    }
  }

  const timeRangeLabels = {
    '1h': 'Last 1 Hour',
    '6h': 'Last 6 Hours',
    '24h': 'Last 24 Hours',
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days'
  }

  const bucketLabels = {
    minute: 'Per Minute',
    hour: 'Per Hour',
    day: 'Per Day'
  }

  return (
    <div className="w-full h-full bg-white rounded-lg shadow-md p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>

        {/* Controls */}
        <div className="flex gap-4 mb-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Time Range</label>
            <select
              value={timeRange}
              onChange={e => setTimeRange(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(timeRangeLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Bucket Size</label>
            <select
              value={bucketSize}
              onChange={e => setBucketSize(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(bucketLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Messages */}
        {loading && (
          <div className="text-center py-8 text-gray-500">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <p className="mt-2">Loading data...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Chart */}
        {!loading && !error && data.length > 0 && (
          <ResponsiveContainer width="100%" height={400}>
            {chartType === 'area' ? (
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip
                  formatter={(value: any) => value?.toFixed(2)}
                  labelFormatter={() => 'Data Point'}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  fill="#93c5fd"
                  name="Value"
                  dot={false}
                />
                {data[0]?.min && (
                  <>
                    <Area
                      type="monotone"
                      dataKey="min"
                      stroke="#ef4444"
                      fill="rgba(239, 68, 68, 0.1)"
                      name="Min"
                      dot={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="max"
                      stroke="#10b981"
                      fill="rgba(16, 185, 129, 0.1)"
                      name="Max"
                      dot={false}
                    />
                  </>
                )}
              </AreaChart>
            ) : (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip
                  formatter={(value: any) => value?.toFixed(2)}
                  labelFormatter={() => 'Data Point'}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  name="Value"
                  dot={false}
                  strokeWidth={2}
                />
                {data[0]?.min && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="min"
                      stroke="#ef4444"
                      name="Min"
                      dot={false}
                      strokeDasharray="5 5"
                      strokeWidth={1}
                    />
                    <Line
                      type="monotone"
                      dataKey="max"
                      stroke="#10b981"
                      name="Max"
                      dot={false}
                      strokeDasharray="5 5"
                      strokeWidth={1}
                    />
                  </>
                )}
              </LineChart>
            )}
          </ResponsiveContainer>
        )}

        {!loading && !error && data.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No data available for the selected time range</p>
          </div>
        )}
      </div>
    </div>
  )
}

"use client"
import { useState } from 'react'

interface SchemaDisplayProps {
  schema?: Record<string, any>
  data?: Record<string, any>
  title?: string
}

export function SchemaDisplay({ schema, data, title = 'Response' }: SchemaDisplayProps) {
  const [view, setView] = useState<'schema' | 'data' | 'both'>('data')

  if (!schema && !data) {
    return <div className="text-gray-500">No data to display</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setView('data')}
          className={`px-4 py-2 font-medium transition-colors ${
            view === 'data'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Data
        </button>
        {schema && (
          <button
            onClick={() => setView('schema')}
            className={`px-4 py-2 font-medium transition-colors ${
              view === 'schema'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Schema
          </button>
        )}
        {schema && data && (
          <button
            onClick={() => setView('both')}
            className={`px-4 py-2 font-medium transition-colors ${
              view === 'both'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Both
          </button>
        )}
      </div>

      <div className={`grid gap-4 ${view === 'both' ? 'grid-cols-2' : ''}`}>
        {(view === 'data' || view === 'both') && data && (
          <div className="bg-white rounded-lg shadow p-4 overflow-auto max-h-96">
            <h3 className="font-semibold mb-2 text-sm text-gray-700">Data</h3>
            <pre className="text-xs whitespace-pre-wrap break-words font-mono">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
        {(view === 'schema' || view === 'both') && schema && (
          <div className="bg-blue-50 rounded-lg shadow p-4 overflow-auto max-h-96">
            <h3 className="font-semibold mb-2 text-sm text-blue-900">Schema</h3>
            <SchemaTree schema={schema} />
          </div>
        )}
      </div>
    </div>
  )
}

function SchemaTree({ schema, depth = 0 }: { schema: any; depth?: number }) {
  if (schema === null || schema === undefined) {
    return <span className="text-gray-500">null</span>
  }

  if (typeof schema !== 'object') {
    return <span className="text-purple-600">{String(schema)}</span>
  }

  if (Array.isArray(schema)) {
    return (
      <div className="ml-4">
        <span className="text-blue-600">Array</span>
        {schema.length > 0 && (
          <div className="ml-2 border-l border-gray-300 pl-2">
            <SchemaTree schema={schema[0]} depth={depth + 1} />
          </div>
        )}
      </div>
    )
  }

  // Object schema
  return (
    <div className="space-y-1">
      {Object.entries(schema).map(([key, value]) => (
        <div key={key} className="ml-2">
          <span className="text-green-700 font-medium">{key}</span>
          {typeof value === 'object' ? (
            <div className="ml-2 border-l border-gray-300 pl-2">
              <SchemaTree schema={value} depth={depth + 1} />
            </div>
          ) : (
            <span className="ml-2 text-purple-600">{String(value)}</span>
          )}
        </div>
      ))}
    </div>
  )
}

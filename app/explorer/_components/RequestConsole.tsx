"use client"
import { useEffect, useState } from 'react'

interface RequestConsoleProps {
  initialPath?: string
  initialMethod?: string
  token?: string
}

function useToken() {
  const [token, setToken] = useState('')
  useEffect(() => {
    setToken(localStorage.getItem('sovd.token') || '')
  }, [])
  return token
}

type Tab = 'params' | 'headers' | 'body'
type ResponseTab = 'body' | 'headers'

// ASAM SOVD v1.0 Parameter Presets per resource type
const PARAMETER_PRESETS: Record<string, Array<{ key: string; value: string }>> = {
  faults: [
    { key: 'include-schema', value: 'false' },
    { key: 'status[timestamp]', value: '' },
    { key: 'status[responseCode]', value: '' },
    { key: 'status[responseMessage]', value: '' },
    { key: 'severity', value: '' },
    { key: 'scopeParameter', value: '' },
    { key: '', value: '' }
  ],
  logs: [
    { key: 'include-schema', value: 'false' },
    { key: 'status[timestamp]', value: '' },
    { key: 'status[stationInfo]', value: '' },
    { key: '', value: '' }
  ],
  operations: [
    { key: 'include-schema', value: 'false' },
    { key: 'scopeParameter', value: '' },
    { key: '', value: '' }
  ],
  data: [
    { key: 'include-schema', value: 'false' },
    { key: '', value: '' }
  ],
  'data-lists': [
    { key: 'include-schema', value: 'false' },
    { key: '', value: '' }
  ],
  configurations: [
    { key: 'include-schema', value: 'false' },
    { key: '', value: '' }
  ],
  'bulk-data': [
    { key: 'include-schema', value: 'false' },
    { key: '', value: '' }
  ],
  updates: [
    { key: 'include-schema', value: 'false' },
    { key: 'status[timestamp]', value: '' },
    { key: '', value: '' }
  ],
  modes: [
    { key: 'include-schema', value: 'false' },
    { key: '', value: '' }
  ],
  locks: [
    { key: 'include-schema', value: 'false' },
    { key: 'scopeParameter', value: '' },
    { key: '', value: '' }
  ],
  default: [
    { key: 'include-schema', value: 'false' },
    { key: '', value: '' },
    { key: '', value: '' },
    { key: '', value: '' }
  ]
}

// Helper to detect resource type from path
function getResourceType(path: string): string {
  const match = path.match(/\/(faults|logs|operations|data|data-lists|configurations|bulk-data|updates|modes|locks|subareas|subcomponents)(?:\/|$)/)
  return match ? match[1] : 'default'
}

export default function RequestConsole({ initialPath, initialMethod, token: propToken }: RequestConsoleProps) {
  const internalToken = useToken()
  const token = typeof propToken !== 'undefined' ? propToken : internalToken

  const [path, setPath] = useState(initialPath || '/v1/Component')
  // Sync prop changes to state
  useEffect(() => {
    if (initialPath) setPath(initialPath)
  }, [initialPath])

  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>(
    (initialMethod as any) || 'GET'
  )
  useEffect(() => {
    if (initialMethod) setMethod(initialMethod as any)
  }, [initialMethod])

  // Request State
  const [activeTab, setActiveTab] = useState<Tab>('params')

  // Initialize with default params, will be updated based on path
  const [queryParams, setQueryParams] = useState<Array<{ key: string; value: string }>>(
    PARAMETER_PRESETS.default
  )

  // Auto-populate parameters when path changes
  useEffect(() => {
    const resourceType = getResourceType(path)
    const preset = PARAMETER_PRESETS[resourceType] || PARAMETER_PRESETS.default
    setQueryParams([...preset])
  }, [path])
  const [headers, setHeaders] = useState<Array<{ key: string; value: string }>>([
    { key: 'Accept', value: 'application/json' },
    { key: 'Content-Type', value: 'application/json' },
    { key: '', value: '' }
  ])
  const [reqBody, setReqBody] = useState('')

  // Response State
  const [resp, setResp] = useState<{
    status: number
    statusText: string
    headers: Record<string, string>
    body: any
    duration: number
    size: number
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [responseTab, setResponseTab] = useState<ResponseTab>('body')

  // Derive final URL
  const getUrl = () => {
    const params = new URLSearchParams()
    queryParams.forEach(p => {
      if (p.key) params.append(p.key, p.value)
    })
    const paramString = params.toString()
    return paramString ? `${path}?${paramString}` : path
  }

  async function send() {
    setLoading(true)
    const startTime = performance.now()
    try {
      const headerObj: Record<string, string> = { Authorization: `Bearer ${token}` }
      headers.forEach(h => {
        if (h.key) headerObj[h.key] = h.value
      })

      const init: RequestInit = { method, headers: headerObj }
      if (method === 'POST' || method === 'PUT') init.body = reqBody

      const finalUrl = getUrl()
      const res = await fetch(finalUrl, init)
      const endTime = performance.now()

      const ct = res.headers.get('content-type') || ''
      const text = await res.text()
      const size = new Blob([text]).size
      let parsedBody = text
      try {
        if (ct.includes('application/json')) {
          parsedBody = JSON.parse(text)
        }
      } catch { }

      setResp({
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        body: parsedBody,
        duration: Math.round(endTime - startTime),
        size
      })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Auto-send on mount or when token becomes available
  useEffect(() => {
    if (token && method === 'GET' && !resp && !loading) {
      send()
    }
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update a row. If editing the last row, add a new one.
  const updateQueryParam = (idx: number, k: keyof typeof queryParams[0], v: string) => {
    const copy = [...queryParams]
    copy[idx][k] = v
    if (idx === copy.length - 1 && (k === 'key' ? v : copy[idx].key)) {
      copy.push({ key: '', value: '' })
    }
    setQueryParams(copy)
  }

  const updateHeader = (idx: number, k: keyof typeof headers[0], v: string) => {
    const copy = [...headers]
    copy[idx][k] = v
    if (idx === copy.length - 1 && (k === 'key' ? v : copy[idx].key)) {
      copy.push({ key: '', value: '' })
    }
    setHeaders(copy)
  }

  const copyToClipboard = () => {
    if (resp?.body) {
      const text = typeof resp.body === 'string' ? resp.body : JSON.stringify(resp.body, null, 2)
      navigator.clipboard.writeText(text)
    }
  }

  // --- Render Helpers ---

  const renderKeyValueTable = (
    items: Array<{ key: string; value: string }>,
    update: (i: number, k: 'key' | 'value', v: string) => void,
    placeholderKey = 'Enter key',
    placeholderValue = 'Enter value'
  ) => (
    <div className="border border-gray-200 bg-white">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left w-1/3 border-b border-r border-gray-200 font-medium text-gray-500 text-xs">Key</th>
            <th className="px-3 py-2 text-left border-b border-gray-200 font-medium text-gray-500 text-xs">Value</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className="hover:bg-blue-50">
              <td className="border-b border-r border-gray-200 p-0">
                <input
                  className="w-full px-3 py-2 outline-none bg-transparent placeholder-gray-300 text-gray-700"
                  value={item.key}
                  onChange={e => update(i, 'key', e.target.value)}
                  placeholder={placeholderKey}
                />
              </td>
              <td className="border-b border-gray-200 p-0">
                <input
                  className="w-full px-3 py-2 outline-none bg-transparent placeholder-gray-300 text-gray-700"
                  value={item.value}
                  onChange={e => update(i, 'value', e.target.value)}
                  placeholder={placeholderValue}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-white rounded shadow-sm border border-gray-200">
      {/* Top Bar: URL & Method */}
      <div className="p-3 border-b bg-gray-50/50 flex gap-3 items-center">
        {/* Navigation Icons (Visual) */}
        <div className="flex gap-2 text-gray-400">
          <button className="hover:text-gray-600"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></button>
          <button className="hover:text-gray-600"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg></button>
          <button className="hover:text-gray-600"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg></button>
        </div>

        {/* Method & URL */}
        <div className="flex-1 flex shadow-sm rounded border border-gray-300 overflow-hidden h-9">
          <div className="bg-white border-r border-gray-200 relative">
            <select
              value={method}
              onChange={e => setMethod(e.target.value as any)}
              className="appearance-none h-full pl-3 pr-8 bg-transparent font-bold text-sm text-gray-700 outline-none cursor-pointer"
            >
              <option className="text-green-600">GET</option>
              <option className="text-blue-600">POST</option>
              <option className="text-orange-600">PUT</option>
              <option className="text-red-600">DELETE</option>
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▼</div>
          </div>
          <input
            value={path}
            onChange={e => setPath(e.target.value)}
            className="flex-1 px-3 py-1 font-mono text-sm outline-none text-gray-700"
          />
        </div>

        <button
          onClick={send}
          disabled={loading}
          className="px-6 h-9 bg-[#3B82F6] text-white font-medium rounded shadow-sm hover:bg-blue-600 disabled:opacity-50 text-sm"
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>

      {/* Request Tabs & Content */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="border-b px-2 flex gap-1 text-sm bg-white">
          <button
            className={`px-4 py-2 border-b-2 font-medium transition-colors ${activeTab === 'params' ? 'border-[#3B82F6] text-[#3B82F6]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
            onClick={() => setActiveTab('params')}
          >
            Parameters
          </button>
          <button
            className={`px-4 py-2 border-b-2 font-medium transition-colors ${activeTab === 'headers' ? 'border-[#3B82F6] text-[#3B82F6]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
            onClick={() => setActiveTab('headers')}
          >
            Headers
          </button>
          <button
            className={`px-4 py-2 border-b-2 font-medium transition-colors ${activeTab === 'body' ? 'border-[#3B82F6] text-[#3B82F6]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
            onClick={() => setActiveTab('body')}
          >
            Body
          </button>
        </div>

        <div className="p-0 overflow-y-auto h-[40%] border-b bg-gray-50/30">
          <div className="p-4">
            {activeTab === 'params' && renderKeyValueTable(queryParams, updateQueryParam)}
            {activeTab === 'headers' && renderKeyValueTable(headers, updateHeader)}
            {activeTab === 'body' && (
              <textarea
                value={reqBody}
                onChange={e => setReqBody(e.target.value)}
                className="w-full h-full min-h-[150px] border border-gray-300 rounded p-3 font-mono text-sm focus:border-blue-500 outline-none"
                placeholder="{}"
              />
            )}
          </div>
        </div>

        {/* Response Section */}
        {resp && (
          <div className="flex-1 flex flex-col min-h-0 bg-white">
            {/* Status Bar */}
            <div className="px-4 py-2 bg-gray-50 border-b flex items-center gap-6 text-sm">
              <span className="font-medium text-gray-500">Response</span>
              <span className={`${resp.status >= 400 ? 'text-red-600' : 'text-green-600'} font-medium`}>
                Status: {resp.status} {resp.statusText}
              </span>
              <span className="text-gray-500">Duration: <span className="text-gray-800">{resp.duration}ms</span></span>
              <span className="text-gray-500">Size: <span className="text-gray-800">{resp.size} B</span></span>
            </div>

            {/* Response Tabs */}
            <div className="border-b px-2 flex gap-1 text-sm bg-white">
              <button
                className={`px-4 py-2 border-b-2 font-medium transition-colors ${responseTab === 'body' ? 'border-[#3B82F6] text-[#3B82F6]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                onClick={() => setResponseTab('body')}
              >
                Body
              </button>
              <button
                className={`px-4 py-2 border-b-2 font-medium transition-colors ${responseTab === 'headers' ? 'border-[#3B82F6] text-[#3B82F6]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                onClick={() => setResponseTab('headers')}
              >
                Headers
              </button>
            </div>

            {/* Response Content */}
            <div className="relative flex-1 bg-white overflow-hidden flex flex-col">
              {responseTab === 'headers' ? (
                <div className="p-4 overflow-y-auto">
                  <pre className="text-xs font-mono text-gray-700">{JSON.stringify(resp.headers, null, 2)}</pre>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="flex justify-end p-2 border-b bg-gray-50/50">
                    <button onClick={copyToClipboard} title="Copy Body" className="p-1 hover:bg-gray-200 rounded text-gray-500">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                  </div>

                  <div className="flex-1 overflow-auto p-4">
                    <pre className="text-xs font-mono whitespace-pre-wrap text-gray-800 leading-relaxed font-medium">
                      {typeof resp.body === 'string' ? resp.body : JSON.stringify(resp.body, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

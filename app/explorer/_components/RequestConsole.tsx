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
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Top Bar: URL & Method */}
      <div className="p-4 border-b border-slate-100 bg-white flex gap-4 items-center">
        {/* Method & URL Input Group */}
        <div className="flex-1 flex shadow-sm rounded-lg border border-slate-200 overflow-hidden h-10 transition-shadow focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300">
          <div className="bg-slate-50 border-r border-slate-200 relative flex items-center min-w-[100px]">
            <select
              value={method}
              onChange={e => setMethod(e.target.value as any)}
              className={`appearance-none h-full w-full pl-4 pr-8 bg-transparent font-bold text-sm outline-none cursor-pointer ${method === 'GET' ? 'text-green-600' :
                  method === 'POST' ? 'text-blue-600' :
                    method === 'PUT' ? 'text-orange-600' :
                      'text-red-600'
                }`}
            >
              <option className="text-gray-900">GET</option>
              <option className="text-gray-900">POST</option>
              <option className="text-gray-900">PUT</option>
              <option className="text-gray-900">DELETE</option>
            </select>
            <div className="absolute right-3 pointer-events-none text-slate-400 text-[10px]">▼</div>
          </div>
          <input
            value={path}
            onChange={e => setPath(e.target.value)}
            className="flex-1 px-4 py-2 font-mono text-sm outline-none text-slate-700 placeholder-slate-400 bg-white"
            placeholder="/v1/..."
          />
        </div>

        <button
          onClick={send}
          disabled={loading}
          className="px-6 h-10 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium rounded-lg shadow-sm shadow-blue-200 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-all active:scale-95 flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <span>Send Request</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </>
          )}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Request Tabs */}
        <div className="border-b border-slate-100 flex px-4 gap-6 text-sm bg-white">
          {(['params', 'headers', 'body'] as const).map((tab) => (
            <button
              key={tab}
              className={`py-3 border-b-2 font-medium transition-all ${activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200'
                }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'params' && queryParams.filter(p => p.key).length > 0 && <span className="ml-2 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">{queryParams.filter(p => p.key).length}</span>}
              {tab === 'headers' && headers.filter(h => h.key).length > 0 && <span className="ml-2 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">{headers.filter(h => h.key).length}</span>}
            </button>
          ))}
        </div>

        {/* Request Panel Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4 border-b border-slate-200 min-h-[30%]">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden min-h-[200px]">
            {activeTab === 'params' && renderKeyValueTable(queryParams, updateQueryParam, 'Parameter Key', 'Value')}
            {activeTab === 'headers' && renderKeyValueTable(headers, updateHeader, 'Header Name', 'Value')}
            {activeTab === 'body' && (
              <textarea
                value={reqBody}
                onChange={e => setReqBody(e.target.value)}
                className="w-full h-full min-h-[200px] p-4 font-mono text-xs leading-relaxed text-slate-700 focus:outline-none resize-none"
                placeholder="{ JSON body }"
              />
            )}
          </div>
        </div>

        {/* Response Section */}
        {resp && (
          <div className="flex-1 flex flex-col min-h-0 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
            {/* Status Bar */}
            <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${resp.status >= 200 && resp.status < 300 ? 'bg-green-100 text-green-700' :
                    resp.status >= 300 && resp.status < 400 ? 'bg-blue-100 text-blue-700' :
                      resp.status >= 400 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                  {resp.status} {resp.statusText}
                </span>
                <span className="text-slate-400 mx-1">|</span>
                <div className="flex gap-4 text-xs text-slate-500 font-mono">
                  <span>{resp.duration}ms</span>
                  <span>{resp.size} B</span>
                </div>
              </div>

              {/* Response Tabs */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg">
                {(['body', 'headers'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setResponseTab(tab)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${responseTab === tab
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                      }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Response Content */}
            <div className="relative flex-1 bg-white overflow-hidden flex flex-col group">
              {responseTab === 'headers' ? (
                <div className="p-4 overflow-y-auto">
                  <div className="border border-slate-100 rounded-lg overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <tbody className="divide-y divide-slate-100">
                        {Object.entries(resp.headers).map(([k, v]) => (
                          <tr key={k} className="hover:bg-slate-50/50">
                            <td className="px-3 py-2 font-medium text-slate-600 bg-slate-50/30 w-1/3">{k}</td>
                            <td className="px-3 py-2 font-mono text-slate-600 break-all">{v}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full relative">
                  <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={copyToClipboard}
                      className="p-1.5 bg-white border border-slate-200 rounded-md shadow-sm hover:bg-slate-50 text-slate-500 transition-colors"
                      title="Copy JSON"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                  </div>

                  <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                    <pre className="text-xs font-mono whitespace-pre-wrap text-slate-700 leading-relaxed">
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

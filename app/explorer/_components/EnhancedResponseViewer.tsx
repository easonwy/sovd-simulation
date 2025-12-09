"use client"
import { useState } from 'react'

interface EnhancedResponseViewerProps {
  response: {
    status: number
    statusText: string
    headers: Record<string, string>
    body: any
    duration: number
    size: number
  }
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
}

export default function EnhancedResponseViewer({ 
  response, 
  isFullscreen, 
  onToggleFullscreen 
}: EnhancedResponseViewerProps) {
  const [activeTab, setActiveTab] = useState<'body' | 'headers'>('body')
  const [viewMode, setViewMode] = useState<'formatted' | 'raw' | 'table'>('formatted')

  function remapUrlString(s: string): string {
    return s.replace(/\/(v1\/)/g, '/sovd/$1').replace(/\/sovd\/v1\//g, '/sovd/v1/')
  }

  function remapBodyForDisplay(body: any): any {
    if (typeof body === 'string') return remapUrlString(body)
    if (Array.isArray(body)) return body.map(remapBodyForDisplay)
    if (body && typeof body === 'object') {
      const out: Record<string, any> = {}
      for (const [k, v] of Object.entries(body)) {
        out[k] = typeof v === 'string' ? remapUrlString(v) : remapBodyForDisplay(v)
      }
      return out
    }
    return body
  }

  const displayBody = remapBodyForDisplay(response?.body)

  const copyToClipboard = () => {
    if (response?.body) {
      const text = typeof displayBody === 'string' ? displayBody : JSON.stringify(displayBody, null, 2)
      navigator.clipboard.writeText(text)
    }
  }

  const downloadJSON = () => {
    if (response?.body) {
      const text = typeof displayBody === 'string' ? displayBody : JSON.stringify(displayBody, null, 2)
      const blob = new Blob([text], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `response-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'bg-green-100 text-green-700'
    if (status >= 300 && status < 400) return 'bg-blue-100 text-blue-700'
    if (status >= 400) return 'bg-red-100 text-red-700'
    return 'bg-gray-100 text-gray-700'
  }

  const getSizeIndicator = (bytes: number) => {
    if (bytes < 1000) return { text: 'Small', class: 'bg-green-100 text-green-600' }
    if (bytes < 10000) return { text: 'Medium', class: 'bg-yellow-100 text-yellow-600' }
    return { text: 'Large', class: 'bg-red-100 text-red-600' }
  }

  const renderBody = () => {
    if (!response.body) return null

    if (viewMode === 'raw') {
      return (
        <div className="flex-1">
          <textarea
            className="w-full h-full p-3 font-mono text-xs text-slate-700 bg-white resize-none border-0 focus:outline-none custom-scrollbar"
            value={typeof displayBody === 'string' ? displayBody : JSON.stringify(displayBody, null, 2)}
            readOnly
          />
        </div>
      )
    }

    if (viewMode === 'table' && typeof displayBody === 'object' && displayBody !== null) {
      const entries = Object.entries(displayBody as Record<string, any>)
      return (
        <div className="p-3 overflow-auto custom-scrollbar">
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-slate-600 border-b border-r border-slate-200">Key</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-600 border-b border-slate-200">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map(([key, value]) => (
                  <tr key={key} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2 font-medium text-slate-700 bg-slate-50/30 border-r border-slate-200 align-top">
                      {key}
                    </td>
                    <td className="px-3 py-2 font-mono text-slate-600 break-all">
                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
    }

    // Default formatted view with syntax highlighting - Fixed scrollbar issue
    return (
      <div className="flex-1 overflow-auto custom-scrollbar response-content max-height-utilization formatted-view">
        <pre
          className="text-xs font-mono whitespace-pre-wrap text-slate-700 leading-relaxed max-w-full p-3 block h-full response-body scrollable-content"
          dangerouslySetInnerHTML={{
            __html: syntaxHighlight(typeof displayBody === 'string' ? displayBody : JSON.stringify(displayBody, null, 2))
          }}
          style={{ 
            wordBreak: 'break-word', 
            overflowWrap: 'break-word',
            maxHeight: '100%',
            display: 'block',
            whiteSpace: 'pre-wrap'
          }}
        />
      </div>
    )
  }

  const renderHeaders = () => {
    return (
      <div className="p-3 overflow-y-auto custom-scrollbar">
        <div className="border border-slate-100 rounded-lg overflow-hidden">
          <table className="w-full text-xs text-left">
            <tbody className="divide-y divide-slate-100">
              {Object.entries(response.headers).map(([k, v]) => (
                <tr key={k} className="hover:bg-slate-50/50">
                  <td className="px-3 py-2 font-medium text-slate-600 bg-slate-50/30 w-1/3">{k}</td>
                  <td className="px-3 py-2 font-mono text-slate-600 break-all">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const syntaxHighlight = (json: string) => {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
      let cls = 'text-purple-600'; // number
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'text-blue-600 font-semibold'; // key
        } else {
          cls = 'text-green-600'; // string
        }
      } else if (/true|false/.test(match)) {
        cls = 'text-orange-600 font-bold'; // boolean
      } else if (/null/.test(match)) {
        cls = 'text-slate-400 italic'; // null
      }
      return '<span class="' + cls + '">' + match + '</span>';
    });
  }

  const sizeIndicator = getSizeIndicator(response.size)

  return (
    <div className="flex flex-col h-full bg-white response-viewer">
      {/* Status Bar - Enhanced */}
      <div className="px-3 py-2 bg-white border-b border-slate-100 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2 py-1 rounded-md text-xs font-bold ${getStatusColor(response.status)}`}>
            {response.status} {response.statusText}
          </span>
          <span className="text-slate-400 mx-1">|</span>
          <div className="flex gap-3 text-xs text-slate-500 font-mono">
            <span>{response.duration}ms</span>
            <span>{formatSize(response.size)}</span>
          </div>
          <span className="text-slate-400">|</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] ${sizeIndicator.class}`}>
            {sizeIndicator.text}
          </span>
        </div>

        {/* Response Tabs & Controls */}
        <div className="flex items-center gap-2">
          {/* View Mode Selector */}
          {activeTab === 'body' && (
            <div className="flex bg-slate-100 p-0.5 rounded-lg">
              {(['formatted', 'raw', 'table'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${viewMode === mode
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          )}

          {/* Response Tabs */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg">
            {(['body', 'headers'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${activeTab === tab
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-1">
            <button
              onClick={copyToClipboard}
              className="p-1.5 bg-white border border-slate-200 rounded-md shadow-sm hover:bg-slate-50 text-slate-500 transition-colors"
              title="Copy to Clipboard"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
            <button
              onClick={downloadJSON}
              className="p-1.5 bg-white border border-slate-200 rounded-md shadow-sm hover:bg-slate-50 text-slate-500 transition-colors"
              title="Download JSON"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
            {onToggleFullscreen && (
              <button
                onClick={onToggleFullscreen}
                className="p-1.5 bg-white border border-slate-200 rounded-md shadow-sm hover:bg-slate-50 text-slate-500 transition-colors"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Response Content */}
      <div className="relative flex-1 bg-white flex flex-col group">
        {activeTab === 'headers' ? renderHeaders() : renderBody()}
      </div>
    </div>
  )
}

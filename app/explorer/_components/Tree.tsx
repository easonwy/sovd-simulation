"use client"
import { useEffect, useState } from 'react'

interface TreeProps {
  onSelect?: (path: string, method: string) => void
  token?: string
  lastResponse?: { path: string; data: any } | null
}

function useToken() {
  const [token, setToken] = useState('')
  useEffect(() => {
    setToken(localStorage.getItem('sovd.token') || '')
  }, [])
  return token
}

async function apiGet(path: string, token: string) {
  if (!token) return { status: 401, body: null, headers: {} }
  try {
    const res = await fetch(path, { headers: { Authorization: `Bearer ${token}` } })
    const ct = res.headers.get('content-type') || ''
    const body = ct.includes('application/json') ? await res.json() : await res.text()
    return { status: res.status, body, headers: Object.fromEntries(res.headers.entries()) }
  } catch (e) {
    return { status: 500, body: null, headers: {} }
  }
}

// Resource mappings per ASAM SOVD v1.0 specification
type ResourceDef = { name: string; methods: string[] }

const RESOURCE_MAP: Record<string, ResourceDef[]> = {
  Component: [
    { name: 'configurations', methods: ['GET'] },
    { name: 'bulk-data', methods: ['GET'] },
    { name: 'data', methods: ['GET', 'POST'] },
    { name: 'data-lists', methods: ['GET', 'POST'] },
    { name: 'faults', methods: ['GET', 'DELETE'] },
    { name: 'operations', methods: ['GET', 'POST'] },
    { name: 'updates', methods: ['GET', 'POST'] },
    { name: 'modes', methods: ['GET'] },
    { name: 'locks', methods: ['GET', 'POST'] },
    { name: 'logs', methods: ['GET'] },
    { name: 'subareas', methods: ['GET'] },
    { name: 'subcomponents', methods: ['GET'] }
  ],
  App: [
    { name: 'configurations', methods: ['GET'] },
    { name: 'bulk-data', methods: ['GET'] },
    { name: 'data', methods: ['GET', 'POST'] },
    { name: 'data-lists', methods: ['GET', 'POST'] },
    { name: 'faults', methods: ['GET', 'DELETE'] },
    { name: 'operations', methods: ['GET', 'POST'] },
    { name: 'updates', methods: ['GET', 'POST'] },
    { name: 'modes', methods: ['GET'] },
    { name: 'locks', methods: ['GET', 'POST'] },
    { name: 'logs', methods: ['GET'] }
  ],
  Function: [
    { name: 'configurations', methods: ['GET'] },
    { name: 'bulk-data', methods: ['GET'] },
    { name: 'data', methods: ['GET', 'POST'] },
    { name: 'data-lists', methods: ['GET', 'POST'] },
    { name: 'faults', methods: ['GET', 'DELETE'] },
    { name: 'operations', methods: ['GET', 'POST'] },
    { name: 'updates', methods: ['GET', 'POST'] },
    { name: 'modes', methods: ['GET'] },
    { name: 'locks', methods: ['GET', 'POST'] },
    { name: 'logs', methods: ['GET'] }
  ],
  Area: [
    { name: 'configurations', methods: ['GET'] },
    { name: 'bulk-data', methods: ['GET'] },
    { name: 'data', methods: ['GET', 'POST'] },
    { name: 'data-lists', methods: ['GET', 'POST'] },
    { name: 'faults', methods: ['GET', 'DELETE'] },
    { name: 'operations', methods: ['GET', 'POST'] },
    { name: 'updates', methods: ['GET', 'POST'] },
    { name: 'modes', methods: ['GET'] },
    { name: 'locks', methods: ['GET', 'POST'] },
    { name: 'logs', methods: ['GET'] },
    { name: 'subareas', methods: ['GET'] },
    { name: 'subcomponents', methods: ['GET'] }
  ]
}

export default function Tree({ onSelect, token: propToken, lastResponse }: TreeProps) {
  const internalToken = useToken()
  const token = typeof propToken !== 'undefined' ? propToken : internalToken
  // Expanded states
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set(['Component']))
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set())
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set())

  // Data states
  const [entities, setEntities] = useState<Record<string, string[]>>({})
  const [faults, setFaults] = useState<Record<string, any[]>>({})

  // Order per ASAM SOVD and UI reference: Component, App, Function, Area
  const COLLECTIONS = ['Component', 'App', 'Function', 'Area']

  async function loadEntities(collection: string) {
    const r = await apiGet(`/v1/${collection}`, token)
    if (r.body?.items) {
      const names = r.body.items.map((x: any) => typeof x === 'string' ? x : x.id)
      setEntities(prev => ({ ...prev, [collection]: names }))
    }
  }

  // No longer need loadFaults - we'll use lastResponse

  function toggleCollection(col: string) {
    const next = new Set(expandedCollections)
    if (next.has(col)) {
      next.delete(col)
    } else {
      next.add(col)
      loadEntities(col)
    }
    setExpandedCollections(next)
  }

  function toggleEntity(uniqueId: string) {
    const next = new Set(expandedEntities)
    if (next.has(uniqueId)) {
      next.delete(uniqueId)
    } else {
      next.add(uniqueId)
    }
    setExpandedEntities(next)
  }

  function toggleResource(resourceKey: string, collection: string, entityId: string) {
    const next = new Set(expandedResources)
    if (next.has(resourceKey)) {
      next.delete(resourceKey)
    } else {
      next.add(resourceKey)
      // Don't auto-load faults here - they'll be loaded when GET is clicked
      // The loadFaults function will be triggered by the response
    }
    setExpandedResources(next)
  }

  function handleSelect(path: string, method: string) {
    if (onSelect) onSelect(path, method)

    // If user is clicking GET on a faults collection, load and expand faults
    if (method === 'GET' && path.match(/\/faults$/)) {
      const match = path.match(/\/v1\/([^/]+)\/([^/]+)\/faults$/)
      if (match) {
        const [, collection, entityId] = match
        const resourceKey = `${collection}/${entityId}/faults`
        // Expand the resource to show fault items
        setExpandedResources(prev => new Set(prev).add(resourceKey))
        // Load faults asynchronously
        loadFaultsAsync(collection, entityId)
      }
    }
  }

  async function loadFaultsAsync(collection: string, entityId: string) {
    const key = `${collection}/${entityId}/faults`
    const r = await apiGet(`/v1/${collection}/${entityId}/faults`, token)
    if (r.body?.items) {
      setFaults(prev => ({ ...prev, [key]: r.body.items }))
    }
  }

  // Listen for successful fault list responses to populate the tree
  useEffect(() => {
    if (lastResponse && lastResponse.path.includes('/faults') && !lastResponse.path.match(/\/faults\/[^/]+$/)) {
      // This is a "list faults" response, not a single fault
      if (lastResponse.data?.items) {
        // Extract the resource key from the path
        // Example: /v1/Component/powertrain-control-unit/faults -> Component/powertrain-control-unit/faults
        const match = lastResponse.path.match(/\/v1\/([^/]+)\/([^/]+)\/faults/)
        if (match) {
          const [, collection, entityId] = match
          const key = `${collection}/${entityId}/faults`
          setFaults(prev => ({ ...prev, [key]: lastResponse.data.items }))
          // Auto-expand the faults resource to show the items
          const resourceKey = key
          setExpandedResources(prev => new Set(prev).add(resourceKey))
        }
      }
    }
  }, [lastResponse])

  useEffect(() => {
    if (token) {
      // Pre-load Component collection as it is open by default
      loadEntities('Component')
    }
  }, [token])

  function collapseAll() {
    setExpandedCollections(new Set())
    setExpandedEntities(new Set())
    setExpandedResources(new Set())
  }

  function expandAll() {
    setExpandedCollections(new Set(COLLECTIONS))
    // Load entities for all collections
    COLLECTIONS.forEach(col => loadEntities(col))
  }

  return (
    <div className="font-sans text-sm overflow-hidden select-none pb-10">
      {/* Collapse/Expand All Toggle */}
      <div className="flex gap-2 mb-3 pb-3 border-b border-slate-100 px-2 sticky top-0 bg-white z-10">
        <button
          onClick={collapseAll}
          className="text-[10px] font-medium px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-slate-600 transition-colors flex-1"
        >
          Collapse All
        </button>
        <button
          onClick={expandAll}
          className="text-[10px] font-medium px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-slate-600 transition-colors flex-1"
        >
          Expand All
        </button>
      </div>

      {COLLECTIONS.map(col => (
        <div key={col} className="mb-1">
          <div
            className={`flex items-center cursor-pointer hover:bg-slate-50 py-1.5 px-2 rounded-md transition-colors ${expandedCollections.has(col) ? 'bg-slate-50/50' : ''}`}
            onClick={() => toggleCollection(col)}
          >
            <span className="text-slate-400 mr-2 w-4 text-center text-[10px] transition-transform duration-200 transform">
              {expandedCollections.has(col) ? '▼' : '▶'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-lg">📦</span>
              <span className="font-semibold text-slate-700">{col}</span>
            </div>
            <span className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 hover:opacity-100">
              {/* Collection Level Badge if needed */}
            </span>
          </div>

          {expandedCollections.has(col) && (
            <div className="ml-3 pl-3 border-l border-slate-200/60 my-1">
              {entities[col]?.map(entityId => {
                const uniqueId = `${col}/${entityId}`
                const isExpanded = expandedEntities.has(uniqueId)
                return (
                  <div key={entityId} className="mt-0.5">
                    <div
                      className="flex items-center cursor-pointer hover:bg-blue-50/50 py-1 px-2 rounded-md transition-colors group"
                      onClick={() => toggleEntity(uniqueId)}
                    >
                      <span className="text-slate-400 mr-2 w-4 text-center text-[10px]">
                        {isExpanded ? '▼' : '▶'}
                      </span>
                      <span className="text-slate-600 font-medium text-xs break-all truncate" title={entityId}>{entityId}</span>
                      <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="text-[10px] font-bold bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 px-1.5 py-0.5 rounded shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSelect(`/v1/${col}/${entityId}`, 'GET')
                          }}
                        >
                          GET
                        </button>
                      </span>
                    </div>

                    {isExpanded && (
                      <div className="ml-4 pl-3 border-l border-slate-200/60 my-0.5 space-y-0.5">
                        {RESOURCE_MAP[col]?.map(resource => {
                          const resourceKey = `${col}/${entityId}/${resource.name}`
                          const isResourceExpanded = expandedResources.has(resourceKey)
                          const hasFaultItems = resource.name === 'faults' && faults[resourceKey] && faults[resourceKey].length > 0
                          const showExpandIcon = hasFaultItems

                          return (
                            <div key={resource.name}>
                              <div className="flex items-center py-1 px-2 rounded hover:bg-slate-50 group">
                                {showExpandIcon ? (
                                  <span
                                    className="text-slate-400 mr-1 w-4 text-center cursor-pointer text-[10px]"
                                    onClick={() => toggleResource(resourceKey, col, entityId)}
                                  >
                                    {isResourceExpanded ? '▼' : '▶'}
                                  </span>
                                ) : (
                                  <span className="mr-1 w-4"></span>
                                )}

                                <span className={`text-xs ${resource.name === 'faults' ? 'text-amber-600 font-medium' : 'text-slate-500'}`}>
                                  {resource.name}
                                </span>

                                <div className="ml-auto opacity-0 group-hover:opacity-100 flex gap-1 transform scale-95">
                                  {resource.methods.map(method => (
                                    <button
                                      key={method}
                                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shadow-sm transition-colors ${method === 'GET' ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' :
                                          method === 'POST' ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' :
                                            method === 'DELETE' ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' :
                                              'bg-slate-100 text-slate-600 border-slate-200'
                                        }`}
                                      onClick={() => handleSelect(`/v1/${col}/${entityId}/${resource.name}`, method)}
                                    >
                                      {method}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Fault Items */}
                              {resource.name === 'faults' && isResourceExpanded && (
                                <div className="ml-2 pl-3 border-l border-amber-100 my-1">
                                  {faults[resourceKey]?.map((fault: any) => (
                                    <div key={fault.code} className="flex items-center py-1 px-1 group hover:bg-amber-50/50 rounded">
                                      <div className={`w-1.5 h-1.5 rounded-full mr-2 shrink-0 ${fault.severity === 'critical' ? 'bg-red-500' :
                                          fault.severity === 'major' ? 'bg-orange-500' :
                                            fault.severity === 'minor' ? 'bg-yellow-500' : 'bg-blue-500'
                                        }`} />
                                      <span className="text-[10px] font-mono text-slate-700 font-semibold mr-2">{fault.code}</span>
                                      <span className="text-[10px] text-slate-500 truncate flex-1">{fault.title}</span>

                                      <div className="opacity-0 group-hover:opacity-100 flex gap-1 ml-1">
                                        <button
                                          className="text-[9px] bg-white border border-slate-200 px-1 rounded hover:text-blue-600"
                                          onClick={() => handleSelect(`/v1/${col}/${entityId}/faults/${fault.code}`, 'GET')}
                                          title="View Details"
                                        >
                                          GET
                                        </button>
                                        <button
                                          className="text-[9px] bg-white border border-slate-200 px-1 rounded hover:text-red-600"
                                          onClick={() => handleSelect(`/v1/${col}/${entityId}/faults/${fault.code}`, 'DELETE')}
                                          title="Clear Fault"
                                        >
                                          DEL
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                  {(!faults[resourceKey] || faults[resourceKey].length === 0) && (
                                    <div className="ml-4 text-[10px] text-slate-400 py-1 italic">No active faults</div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
              {(!entities[col] || entities[col].length === 0) && (
                <div className="ml-4 text-xs text-slate-400 py-1">No entities found</div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

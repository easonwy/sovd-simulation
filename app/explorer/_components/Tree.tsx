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
    <div className="font-mono text-sm overflow-hidden">
      {/* Collapse/Expand All Toggle */}
      <div className="flex gap-2 mb-2 pb-2 border-b border-gray-200">
        <button
          onClick={collapseAll}
          className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
        >
          Collapse All
        </button>
        <button
          onClick={expandAll}
          className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
        >
          Expand All
        </button>
      </div>

      {COLLECTIONS.map(col => (
        <div key={col} className="mb-1">
          <div
            className="flex items-center cursor-pointer hover:bg-gray-100 py-1"
            onClick={() => toggleCollection(col)}
          >
            <span className="text-gray-400 mr-2 w-4 text-center">
              {expandedCollections.has(col) ? '▼' : '▶'}
            </span>
            <span className="font-bold text-blue-600">{col.toLowerCase()}s</span>
            <span className="ml-auto flex gap-1">
              <span className="text-[10px] bg-green-100 text-green-800 px-1 rounded">GET</span>
            </span>
          </div>

          {expandedCollections.has(col) && (
            <div className="ml-4 border-l border-gray-200 pl-1">
              {entities[col]?.map(entityId => {
                const uniqueId = `${col}/${entityId}`
                const isExpanded = expandedEntities.has(uniqueId)
                return (
                  <div key={entityId} className="mt-1">
                    <div
                      className="flex items-center cursor-pointer hover:bg-gray-100 py-1"
                      onClick={() => toggleEntity(uniqueId)}
                    >
                      <span className="text-gray-400 mr-2 w-4 text-center">
                        {isExpanded ? '▼' : '▶'}
                      </span>
                      <span className="text-gray-700">{entityId}</span>
                      <span className="ml-auto mr-2">
                        <button
                          className="text-[10px] bg-green-100 text-green-800 px-1 rounded hover:bg-green-200"
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
                      <div className="ml-6 border-l border-gray-200 pl-1">
                        {RESOURCE_MAP[col]?.map(resource => {
                          const resourceKey = `${col}/${entityId}/${resource.name}`
                          const isResourceExpanded = expandedResources.has(resourceKey)
                          // Only show expand icon if faults resource has items
                          const hasFaultItems = resource.name === 'faults' && faults[resourceKey] && faults[resourceKey].length > 0
                          const showExpandIcon = hasFaultItems

                          return (
                            <div key={resource.name} className="mt-1">
                              <div className="flex items-center py-1 group hover:bg-gray-50">
                                {showExpandIcon && (
                                  <span
                                    className="text-gray-400 mr-1 w-4 text-center cursor-pointer"
                                    onClick={() => toggleResource(resourceKey, col, entityId)}
                                  >
                                    {isResourceExpanded ? '▼' : '▶'}
                                  </span>
                                )}
                                {!showExpandIcon && <span className="mr-1 w-4"></span>}
                                <span className="text-gray-500 mr-2">›</span>
                                <span className="text-gray-600">{resource.name}</span>
                                <div className="ml-auto opacity-0 group-hover:opacity-100 flex gap-1 mr-2">
                                  {resource.methods.map(method => (
                                    <button
                                      key={method}
                                      className={`text-[10px] px-1 rounded ${method === 'GET' ? 'bg-green-100 text-green-800' :
                                        method === 'POST' ? 'bg-blue-100 text-blue-800' :
                                          method === 'DELETE' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}
                                      onClick={() => handleSelect(`/v1/${col}/${entityId}/${resource.name}`, method)}
                                    >
                                      {method}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Show individual fault items */}
                              {resource.name === 'faults' && isResourceExpanded && (
                                <div className="ml-6 border-l border-gray-200 pl-1">
                                  {faults[resourceKey]?.map((fault: any) => (
                                    <div key={fault.code} className="flex items-center py-1 group hover:bg-gray-50">
                                      <span className="text-gray-400 mr-2 ml-4">•</span>
                                      <span className="text-xs text-gray-700 font-semibold mr-2">{fault.code}</span>
                                      <span className="text-xs text-gray-500 truncate flex-1">{fault.title}</span>
                                      <span className={`text-[9px] px-1 rounded mr-2 ${fault.severity === 'critical' ? 'bg-red-100 text-red-700' :
                                        fault.severity === 'major' ? 'bg-orange-100 text-orange-700' :
                                          fault.severity === 'minor' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                        {fault.severity}
                                      </span>
                                      <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                                        <button
                                          className="text-[10px] bg-green-100 text-green-800 px-1 rounded"
                                          onClick={() => handleSelect(`/v1/${col}/${entityId}/faults/${fault.code}`, 'GET')}
                                        >
                                          GET
                                        </button>
                                        <button
                                          className="text-[10px] bg-red-100 text-red-800 px-1 rounded"
                                          onClick={() => handleSelect(`/v1/${col}/${entityId}/faults/${fault.code}`, 'DELETE')}
                                        >
                                          DELETE
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                  {(!faults[resourceKey] || faults[resourceKey].length === 0) && (
                                    <div className="ml-10 text-xs text-gray-400 py-1">No faults</div>
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
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

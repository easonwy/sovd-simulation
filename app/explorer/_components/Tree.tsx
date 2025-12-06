"use client"
import { useEffect, useState } from 'react'

interface TreeProps {
  onSelect?: (path: string, method: string) => void
  token?: string
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

export default function Tree({ onSelect, token: propToken }: TreeProps) {
  const internalToken = useToken()
  const token = typeof propToken !== 'undefined' ? propToken : internalToken
  // Expanded states
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set(['Component']))
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set())

  // Data states
  const [entities, setEntities] = useState<Record<string, string[]>>({})

  // Order per ASAM SOVD and UI reference: Component, App, Function, Area
  const COLLECTIONS = ['Component', 'App', 'Function', 'Area']

  async function loadEntities(collection: string) {
    const r = await apiGet(`/v1/${collection}`, token)
    if (r.body?.items) {
      const names = r.body.items.map((x: any) => typeof x === 'string' ? x : x.id)
      setEntities(prev => ({ ...prev, [collection]: names }))
    }
  }

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

  function handleSelect(path: string, method: string) {
    if (onSelect) onSelect(path, method)
  }

  useEffect(() => {
    if (token) {
      // Pre-load Component collection as it is open by default
      loadEntities('Component')
    }
  }, [token])

  return (
    <div className="font-mono text-sm overflow-hidden">
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
                        {RESOURCE_MAP[col]?.map(resource => (
                          <div key={resource.name} className="flex items-center py-1 group hover:bg-gray-50">
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
                        ))}
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

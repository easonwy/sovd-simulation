"use client"
import { useEffect, useState } from 'react'

function useToken() {
  const [token, setToken] = useState('')
  useEffect(() => {
    setToken(localStorage.getItem('sovd.token') || '')
  }, [])
  return token
}

async function apiGet(path: string, token: string) {
  const res = await fetch(path, { headers: { Authorization: `Bearer ${token}` } })
  const ct = res.headers.get('content-type') || ''
  const body = ct.includes('application/json') ? await res.json() : await res.text()
  return { status: res.status, body, headers: Object.fromEntries(res.headers.entries()) }
}

export default function Tree() {
  const token = useToken()
  const [collection, setCollection] = useState<'Area' | 'Component' | 'App' | 'Function'>('App')
  const [items, setItems] = useState<string[]>([])
  const [selected, setSelected] = useState<string>('')
  const [detail, setDetail] = useState<any>(null)

  async function loadCollection() {
    if (!token) return
    const r = await apiGet(`/v1/${collection}`, token)
    const it = Array.isArray(r.body.items) ? r.body.items : []
    setItems(it.map((x: any) => (typeof x === 'string' ? x : x.id || x.name || JSON.stringify(x))))
    setSelected('')
    setDetail(null)
  }

  async function loadDetail(id: string) {
    if (!token) return
    setSelected(id)
    const r = await apiGet(`/v1/${collection}/${encodeURIComponent(id)}`, token)
    setDetail(r.body)
  }

  useEffect(() => {
    loadCollection()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection, token])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 12 }}>
      <div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <label>Collection</label>
          <select value={collection} onChange={e => setCollection(e.target.value as any)}>
            <option>Area</option>
            <option>Component</option>
            <option>App</option>
            <option>Function</option>
          </select>
        </div>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {items.map(id => (
            <li key={id}>
              <button onClick={() => loadDetail(id)} style={{ width: '100%', textAlign: 'left' }}>{id}</button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        {selected && <h3>{collection} / {selected}</h3>}
        {detail && <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(detail, null, 2)}</pre>}
      </div>
    </div>
  )
}

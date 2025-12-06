"use client"
import { useEffect, useState } from 'react'

function useToken() {
  const [token, setToken] = useState('')
  useEffect(() => {
    setToken(localStorage.getItem('sovd.token') || '')
  }, [])
  return token
}

export default function RequestConsole() {
  const token = useToken()
  const [path, setPath] = useState('/v1/App/WindowControl/data')
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET')
  const [contentType, setContentType] = useState('application/json')
  const [accept, setAccept] = useState('application/json')
  const [body, setBody] = useState('')
  const [resp, setResp] = useState<{ status: number; headers: Record<string, string>; body: any } | null>(null)

  async function send() {
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` }
    if (contentType) headers['Content-Type'] = contentType
    if (accept) headers['Accept'] = accept
    const init: RequestInit = { method, headers }
    if (method === 'POST' || method === 'PUT') init.body = body
    const res = await fetch(path, init)
    const ct = res.headers.get('content-type') || ''
    const out = ct.includes('application/json') ? await res.json() : await res.text()
    setResp({ status: res.status, headers: Object.fromEntries(res.headers.entries()), body: out })
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8 }}>
        <input value={path} onChange={e => setPath(e.target.value)} />
        <select value={method} onChange={e => setMethod(e.target.value as any)}>
          <option>GET</option>
          <option>POST</option>
          <option>PUT</option>
          <option>DELETE</option>
        </select>
        <button onClick={send}>Send</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <label>Content-Type</label>
          <input value={contentType} onChange={e => setContentType(e.target.value)} />
        </div>
        <div>
          <label>Accept</label>
          <input value={accept} onChange={e => setAccept(e.target.value)} />
        </div>
      </div>
      {(method === 'POST' || method === 'PUT') && (
        <textarea rows={10} value={body} onChange={e => setBody(e.target.value)} placeholder="body" />
      )}
      {resp && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <h4>Status</h4>
            <div>{resp.status}</div>
            <h4>Headers</h4>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(resp.headers, null, 2)}</pre>
          </div>
          <div>
            <h4>Body</h4>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{typeof resp.body === 'string' ? resp.body : JSON.stringify(resp.body, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  )
}

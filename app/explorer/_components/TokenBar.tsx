"use client"
import { useEffect, useState } from 'react'

export default function TokenBar() {
  const [role, setRole] = useState<'Viewer' | 'Developer' | 'Admin'>('Developer')
  const [token, setToken] = useState<string>('')
  useEffect(() => {
    const t = localStorage.getItem('sovd.token') || ''
    setToken(t)
  }, [])
  async function issue() {
    const res = await fetch('/v1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ grant_type: 'client_credentials', role })
    })
    const json = await res.json()
    localStorage.setItem('sovd.token', json.access_token)
    setToken(json.access_token)
  }
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
      <label>Role</label>
      <select value={role} onChange={e => setRole(e.target.value as any)}>
        <option>Viewer</option>
        <option>Developer</option>
        <option>Admin</option>
      </select>
      <button onClick={issue}>Get Token</button>
      <input readOnly value={token} placeholder="token" style={{ flex: 1 }} />
    </div>
  )
}
